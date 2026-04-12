import { Component, ViewChild, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonContent } from '@ionic/angular/standalone';
import { db } from '../firebase.config';
import { ref, push, onValue, DatabaseReference } from 'firebase/database';

interface Post {
  id:                string;
  img:               string;
  location:          string;
  description?:      string;
  breed:             string;
  color?:            string;
  lastSeenTimestamp: number | null;
  timestamp:         number;
}

interface ActiveFilters {
  location: string[];
  breed:    string[];
  time:     string[];
}

type FilterCategory = keyof ActiveFilters;

@Component({
  selector:    'app-home',
  templateUrl: 'home.page.html',
  styleUrls:   ['home.page.scss'],
  imports:     [IonHeader, IonToolbar, IonContent],
})
export class HomePage implements OnInit {

  @ViewChild(IonContent) content!: IonContent;

  private postsRef: DatabaseReference = ref(db, 'posts');
  private cardsData:     Post[]        = [];
  private activeFilters: ActiveFilters = { location: [], breed: [], time: [] };
  private currentCard:   Post | null   = null;

  ngOnInit(): void {
    this.loadDataFromFirebase();
    this.initFilters();
    this.initLocationSearch();

    document.addEventListener('click', () => {
      this.getEl('filterBox')?.classList.remove('active');
    });
  }

  scrollToNext(): void {
    const el = document.getElementById('next-section');
    if (el) this.content.scrollToPoint(0, el.offsetTop, 500);
  }

  private getEl<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  private formatTimestamp(ts: number | null | undefined): string {
    if (!ts) return 'Unknown';
    const diff  = Date.now() - ts;
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    const weeks = Math.floor(diff / 604_800_000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  < 7)  return `${days}d ago`;
    return `${weeks}w ago`;
  }

  private getTimeRangeMs(value: string): number | null {
    const map: Record<string, number> = {
      '1h':  1  * 60 * 60 * 1000,
      '5h':  5  * 60 * 60 * 1000,
      '10h': 10 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '2d':  2  * 24 * 60 * 60 * 1000,
      '1w':  7  * 24 * 60 * 60 * 1000,
      '2w':  14 * 24 * 60 * 60 * 1000,
    };
    return map[value] ?? null;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target?.result as string ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private renderCards(): void {
    const cardsGrid = this.getEl<HTMLDivElement>('cardsGrid');
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';

    if (this.cardsData.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty_message';
      empty.innerText = '🐶 No lost pets yet. Be the first to report!';
      cardsGrid.appendChild(empty);
      return;
    }

    this.cardsData.forEach(card => {
      const el = document.createElement('div');
      el.className = 'card';
      el.setAttribute('data-id',       card.id);
      el.setAttribute('data-location', card.location);
      el.setAttribute('data-breed',    card.breed);
      el.setAttribute('data-lastseen', String(card.lastSeenTimestamp ?? 0));
      el.innerHTML = `
        <img src="${card.img}" class="card_img" loading="lazy" alt="pet">
        <div class="card_info">
          <div class="location">📍 ${card.location}</div>
          <span class="time">⏱ ${this.formatTimestamp(card.lastSeenTimestamp)}</span>
        </div>
      `;
      el.addEventListener('click', () => this.openModal(card));
      cardsGrid.appendChild(el);
    });

    this.applyFilters();
  }

  private applyFilters(): void {
    const now = Date.now();
    document.querySelectorAll<HTMLElement>('.card').forEach(card => {
      const location   = card.getAttribute('data-location') ?? '';
      const breed      = card.getAttribute('data-breed') ?? '';
      const lastSeenTs = parseInt(card.getAttribute('data-lastseen') ?? '0', 10);

      const matchLocation = this.activeFilters.location.length === 0 || this.activeFilters.location.includes(location);
      const matchBreed    = this.activeFilters.breed.length === 0    || this.activeFilters.breed.includes(breed);

      let matchTime = true;
      if (this.activeFilters.time.length > 0) {
        const ranges     = this.activeFilters.time.map(v => this.getTimeRangeMs(v)).filter((v): v is number => v !== null);
        const maxRangeMs = Math.max(...ranges);
        matchTime = lastSeenTs > 0 && (now - lastSeenTs) <= maxRangeMs;
      }

      card.style.display = (matchLocation && matchBreed && matchTime) ? '' : 'none';
    });
  }

  private createFilterTag(value: string, category: FilterCategory): void {
    const containerIds: Record<FilterCategory, string> = {
      location: 'tagsLocation',
      breed:    'tagsBreed',
      time:     'tagsTime',
    };

    const container = this.getEl<HTMLDivElement>(containerIds[category]);
    if (!container) return;

    const alreadyExists = Array.from(container.querySelectorAll('.tag'))
      .some(tag => tag.textContent?.trim().startsWith(value));
    if (alreadyExists) return;

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${value} <span>✖</span>`;
    tag.querySelector('span')!.addEventListener('click', () => {
      this.activeFilters[category] = this.activeFilters[category].filter(v => v !== value);
      tag.remove();
      this.applyFilters();
    });
    container.appendChild(tag);
  }

  private initFilters(): void {
    const categoryMap: Record<string, FilterCategory> = {
      tagsLocation: 'location',
      tagsBreed:    'breed',
      tagsTime:     'time',
    };

    document.querySelectorAll<HTMLSelectElement>('.filterSelect').forEach(select => {
      select.addEventListener('change', () => {
        const value    = select.value;
        const parentId = select.closest('.tags_container')?.id ?? '';
        const category = categoryMap[parentId];

        if (!value || !category || this.activeFilters[category].includes(value)) return;

        this.activeFilters[category].push(value);
        this.createFilterTag(value, category);
        select.value = '';
        this.applyFilters();
      });
    });
  }

  private initLocationSearch(): void {
    const searchInput    = this.getEl<HTMLInputElement>('locationSearch');
    const locationSelect = this.getEl<HTMLSelectElement>('locationSelect');
    if (!searchInput || !locationSelect) return;

    const allOptions  = Array.from(locationSelect.options).slice(1);
    const placeholder = locationSelect.options[0];

    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase().trim();
      locationSelect.innerHTML = '';
      locationSelect.appendChild(placeholder.cloneNode(true) as HTMLOptionElement);

      const matches = term
        ? allOptions.filter(opt => opt.text.toLowerCase().includes(term))
        : allOptions;

      matches.forEach(opt => locationSelect.appendChild(opt.cloneNode(true) as HTMLOptionElement));

      if (locationSelect.options.length === 1) {
        const noResult = new Option('No results', '', false, false);
        noResult.disabled = true;
        locationSelect.appendChild(noResult);
      }

      locationSelect.size = Math.min(matches.length + 1, 6);
    });

    locationSelect.addEventListener('change', () => {
      locationSelect.size      = 0;
      searchInput.value        = '';
      locationSelect.innerHTML = '';
      locationSelect.appendChild(placeholder.cloneNode(true) as HTMLOptionElement);
      allOptions.forEach(opt => locationSelect.appendChild(opt.cloneNode(true) as HTMLOptionElement));
    });
  }

  private openModal(card: Post): void {
    this.currentCard = card;
    this.getEl<HTMLImageElement>('modalImg').src       = card.img;
    this.getEl('modalLocation').textContent            = card.location;
    this.getEl('modalDescription').textContent         = card.description ?? 'No description';
    this.getEl('modalBreed').textContent               = card.breed;
    this.getEl('modalColor').textContent               = card.color ?? 'Not specified';
    this.getEl('modalTime').textContent                = this.formatTimestamp(card.lastSeenTimestamp);
    this.getEl('modalPublished').textContent           = this.formatTimestamp(card.timestamp);
    this.getEl('modal').classList.add('active');
  }

  closeModal(): void {
    this.getEl('modal').classList.remove('active');
    this.currentCard = null;
  }

  openCreateModal(): void {
    this.getEl('modalCreate').classList.add('active');
    this.getEl<HTMLFormElement>('createForm').reset();
    this.getEl<HTMLInputElement>('imageUrl').value  = '';
    this.getEl<HTMLInputElement>('imageFile').value = '';
  }

  closeCreateModal(): void {
    this.getEl('modalCreate').classList.remove('active');
  }

  toggleFilterBox(e: MouseEvent): void {
    e.stopPropagation();
    this.getEl('filterBox').classList.toggle('active');
  }

  private loadDataFromFirebase(): void {
    onValue(this.postsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Post, 'id'>> | null;
      this.cardsData = data
        ? Object.entries(data).map(([id, card]) => ({ id, ...card }))
        : [];
      this.renderCards();
    }, (error) => {
      console.error('Firebase read error:', error);
      alert('Error loading data. Check console.');
    });
  }

  private async savePostToFirebase(
    img:               string,
    location:          string,
    description:       string,
    breed:             string,
    color:             string,
    lastSeenTimestamp: number | null
  ): Promise<void> {
    try {
      await push(this.postsRef, { img, location, description, breed, color, lastSeenTimestamp, timestamp: Date.now() });
    } catch (error) {
      console.error('Firebase write error:', error);
      alert('Error saving to database.');
    }
  }

  async onFormSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault();

    const imageFileInput = this.getEl<HTMLInputElement>('imageFile');
    const imageUrlInput  = this.getEl<HTMLInputElement>('imageUrl');

    let imageUrl = '';
    if (imageFileInput.files && imageFileInput.files.length > 0) {
      imageUrl = await this.fileToBase64(imageFileInput.files[0]);
    } else if (imageUrlInput.value.trim()) {
      imageUrl = imageUrlInput.value.trim();
    }

    const location          = this.getEl<HTMLInputElement>('locationInput').value.trim();
    const description       = this.getEl<HTMLTextAreaElement>('descriptionInput').value.trim();
    const breed             = this.getEl<HTMLSelectElement>('breedInput').value;
    const color             = this.getEl<HTMLInputElement>('colorInput').value.trim();
    const lastSeenValue     = this.getEl<HTMLInputElement>('lastSeenInput').value;
    const lastSeenTimestamp = lastSeenValue ? new Date(lastSeenValue).getTime() : null;

    if (!imageUrl || !location || !breed) {
      alert('Image, Location and Breed are required.');
      return;
    }

    if (lastSeenTimestamp && lastSeenTimestamp > Date.now()) {
      alert('Last seen time cannot be in the future.');
      return;
    }

    await this.savePostToFirebase(imageUrl, location, description, breed, color, lastSeenTimestamp);
    this.closeCreateModal();
  }

  onSendMessage(): void {
    alert(`📩 Message to owner of ${this.currentCard?.breed ?? 'pet'}. This feature will be available soon.`);
  }
}