import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDQLXsQhlnoo1azB_ozw56-N6E4q5i_YB8",
    authDomain: "pawtrol-pups.firebaseapp.com",
    databaseURL: "https://pawtrol-pups-default-rtdb.firebaseio.com",
    projectId: "pawtrol-pups",
    storageBucket: "pawtrol-pups.firebasestorage.app",
    messagingSenderId: "518548262922",
    appId: "1:518548262922:web:36199cbb33804c59970ff3"
};


export const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);