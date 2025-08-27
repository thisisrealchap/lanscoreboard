import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase'; // adapte le chemin selon ta structure
import { generateSingleEliminationMatches } from './generateMatches'; // ou ton utilitaire actuel

export const generateNextRoundMatches = async (tournamentId, boFormat = 'bo1') => {
  try {
    const matchRef = collection(db, 'tournaments', tournamentId, 'matches');
    const snapshot = await getDocs(matchRef);
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const latestRound = Math.max(...matches.map(m => m.round || 1));
    const currentMatches = matches.filter(m => (m.round || 1) === latestRound);

    const winners = currentMatches.map(m => m.winnerId).filter(Boolean);

    if (winners.length !== currentMatches.length) {
      console.warn("Tous les matchs du tour actuel n'ont pas encore de gagnant.");
      return;
    }

    if (winners.length < 2) {
      console.log("Tournoi terminé 🎉 Vainqueur :", winners[0]);
      return;
    }

    const nextMatches = generateSingleEliminationMatches(winners, boFormat);
    for (const match of nextMatches) {
      await addDoc(matchRef, { ...match, round: latestRound + 1 });
    }

    console.log(`✅ Tour ${latestRound + 1} généré avec ${nextMatches.length} match(s).`);
  } catch (error) {
    console.error("Erreur lors de la génération du tour suivant :", error);
  }
};