import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    *censured*
};

export const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);
