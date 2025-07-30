let transactions = [];
let objectifs = [];

// Formater les montants en €
function formatMontant (montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

// Fonction pour obtenir la date
function getTodayDate () {
    return new Date().toISOString().split('T')[0];
}

function calculerTotaux () {
    let revenusTotaux = 0;
    let depensesTotales = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'Revenus') {
            revenusTotaux += parseFloat(transaction.montant);
        } else if (transaction.type === 'Dépenses') {
            depensesTotales += parseFloat(transaction.montant);
        }
    });

    const beneficeNet = revenusTotaux - depensesTotales;

    document.getElementById('montantRevenus').textContent = formatMontant(revenusTotaux);
    document.getElementById('montantDepenses').textContent = formatMontant(depensesTotales);
    document.getElementById('montantBenefices').textContent = formatMontant(beneficeNet);

    return {revenusTotaux, depensesTotales, beneficeNet};
}

function addTransaction (event) {

    if(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const description = document.getElementById('description').value.trim();
    const montant = parseFloat(document.getElementById('montant').value);
    const type = document.getElementById('typeFormulaire').value;
    const categorie = document.getElementById('selecteurFormulaire').value;
    const date = document.getElementById('formulaireCalendrier').value;

    if (!description) {
        alert ('Veuillez saisir une description');
        return false;
    }

    if (isNaN(montant) || montant <= 0) {
        alert ('Veuillez saisir un montant valide');
        return false;
    }

    if (type === 'Sélectionner') {
        alert ('Veuillez sélectionner un type de transaction');
        return false;
    }

    if (!date) {
        alert('Veuillez sélectionner une date');
        return false;
    }

    const transaction = {
        id: Date.now(),
        description: description,
        montant: montant,
        type: type,
        categorie: categorie,
        date: date
    };

    transactions.push(transaction);

    // Réinitialisation du formulaire
    document.getElementById('transactionFormulaire').reset ();
    // Remettre la date du jour après un reset
    document.getElementById('formulaireCalendrier').value = getTodayDate();

    calculerTotaux();
    afficherTransactions();
    calculerRapportFinancier();
    afficherObjectifs();
}

function afficherTransactions (transactionsFiltrees = null) {
    const tableau = document.getElementById('transactionsTable');
    const transactionsAAfficher = transactionsFiltrees || transactions;

    tableau.innerHTML = '';

    if(transactionsAAfficher.length === 0) {
        const ligne = document.createElement('tr');
        ligne.innerHTML = `<td colspan="6" style="text-align: center; font-style: italic;">Aucune transaction à afficher</td>`;
        tableau.appendChild(ligne);
        return;
    }

    const transactionsTriees = [...transactionsAAfficher].sort ((a, b) => new Date(b.date) - new Date(a.date));

    transactionsTriees.forEach (transaction => {
        const ligne = document.createElement('tr');
        ligne.innerHTML = `
        <td>${new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
            <td>${transaction.description}</td>
            <td>${transaction.categorie}</td>
            <td>${transaction.type}</td>
            <td>${formatMontant(transaction.montant)}</td>
            <td>
                <button onclick="supprimerTransaction(${transaction.id})" style="background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Supprimer
                </button>
            </td>
        `;
        tableau.appendChild(ligne);
    });
}

function supprimerTransaction (id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        transactions = transactions.filter(transaction => transaction !== id);
        calculerTotaux();
        afficherTransactions();
        calculerRapportFinancier();
        afficherObjectifs();
    }
}

// Création d'un objectif financier
function createGoal() {
    const nom = document.getElementById('nomObjectif').value.trim();
    const montantCible = parseFloat(document.getElementById('montantCible').value);
    const dateLimite = document.getElementById('calendrierObjectif').value;

    if (!nom) {
        alert ('Veuillez saisir un montant cible valide');
        return;
    }

    if (isNaN(montantCible) || montantCible <= 0) {
        alert ('Veuillez saisir un montant cible valide');
        return;
    }

    if (!dateLimite) {
        alert ('Veuillez sélectionner une date limite');
        return;
    }

    const objectif = {
        id: Date.now(),
        nom: nom,
        montantCible: montantCible,
        dateLimite: dateLimite,
        dateCreation: getTodayDate()
    };

    objectifs.push(objectif);

    // Réinitialisation du formulaire
    document.getElementById('nomObjectif').value = '';
    document.getElementById('montantCible').value = '';
    document.getElementById('calendrierObjectif').value = '';

    afficherObjectifs();
}

function afficherObjectifs() {
    // Vérifier si la section d'affichage des objectifs existe, sinon la créer
    let sectionObjectifs = document.getElementById('listeObjectifs');
    if (!sectionObjectifs) {
        creerSectionAffichageObjectifs();
        sectionObjectifs = document.getElementById('listeObjectifs');
    }
    
    const container = document.getElementById('objectifsContainer');
    
    // Vider le container
    container.innerHTML = '';
    
    if (objectifs.length === 0) {
        container.innerHTML = '<p style="text-align: center; font-style: italic; color: #666;">Aucun objectif créé pour le moment</p>';
        return;
    }
    
    // Calculer le bénéfice actuel pour la progression
    const totaux = calculerTotauxSilencieux(); // Version silencieuse pour éviter les loops
    const beneficeActuel = totaux.beneficeNet;
    
    objectifs.forEach(objectif => {
        const progression = Math.min((beneficeActuel / objectif.montantCible) * 100, 100);
        const joursRestants = calculerJoursRestants(objectif.dateLimite);
        const statutDate = joursRestants > 0 ? `${joursRestants} jours restants` : 
                          joursRestants === 0 ? 'Expire aujourd\'hui' : 
                          `Expiré depuis ${Math.abs(joursRestants)} jours`;
        
        const couleurStatut = joursRestants > 30 ? '#27ae60' : 
                             joursRestants > 7 ? '#f39c12' : '#e74c3c';
        
        const div = document.createElement('div');
        div.className = 'objectif-item';
        div.innerHTML = `
            <div style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; margin: 10px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #2c3e50;">${objectif.nom}</h3>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Objectif:</strong> ${formatMontant(objectif.montantCible)}<br>
                    <strong>Progression:</strong> ${formatMontant(beneficeActuel)} / ${formatMontant(objectif.montantCible)}
                </div>
                
                <div style="background: #ecf0f1; border-radius: 10px; padding: 3px; margin: 10px 0;">
                    <div style="background: linear-gradient(90deg, #3498db, #2ecc71); height: 20px; width: ${progression}%; border-radius: 8px; transition: width 0.3s ease;"></div>
                </div>
                <div style="text-align: center; font-weight: bold; color: #2c3e50;">${progression.toFixed(1)}% complété</div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 0.9em; text-align: center;>
                    <span>Créé le: ${new Date(objectif.dateCreation).toLocaleDateString('fr-FR')}</span>
                    <span style="color: ${couleurStatut}; font-weight: bold;">${statutDate}</span>
                    <button onclick="supprimerObjectif(${objectif.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                        Supprimer
                    </button>
                </div>
                
                <div style="margin-top: 10px; text-align: center;">
                    <strong>Date limite:</strong> ${new Date(objectif.dateLimite).toLocaleDateString('fr-FR')}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// === FONCTION UTILITAIRE: Créer la section d'affichage des objectifs ===
function creerSectionAffichageObjectifs() {
    const conteneurPrincipal = document.getElementById('containerApp');
    
    const sectionObjectifs = document.createElement('div');
    sectionObjectifs.id = 'listeObjectifs';
    sectionObjectifs.innerHTML = `
        <div style="background-color: #f1efef; border: 1px solid black; border-radius: 10px; margin: 2rem; padding: 1rem; color: #3d3d3d; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); box-shadow: 1px 1px 1px rgba(0,0,0,0.3);">
            <h1 style="text-align: center; margin-bottom: 1rem;">Mes Objectifs Financiers</h1>
            <div id="objectifsContainer"></div>
        </div>
    `;
    
    // Insérer après la section de création d'objectifs
    const sectionCreation = document.getElementById('objectifsFinanciers');
    sectionCreation.parentNode.insertBefore(sectionObjectifs, sectionCreation.nextSibling);
}

// === FONCTION UTILITAIRE: Calculer les jours restants ===
function calculerJoursRestants(dateLimite) {
    const aujourdhui = new Date();
    const limite = new Date(dateLimite);
    const diffTime = limite - aujourdhui;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// === FONCTION UTILITAIRE: Version silencieuse des calculs ===
function calculerTotauxSilencieux() {
    let totalRevenus = 0;
    let totalDepenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'Revenus') {
            totalRevenus += parseFloat(transaction.montant);
        } else if (transaction.type === 'Dépenses') {
            totalDepenses += parseFloat(transaction.montant);
        }
    });
    
    const beneficeNet = totalRevenus - totalDepenses;
    return { totalRevenus, totalDepenses, beneficeNet };
}

// === FONCTION: Supprimer un objectif ===
function supprimerObjectif(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        objectifs = objectifs.filter(objectif => objectif.id !== id);
        afficherObjectifs();
    }
}

// Calcul du rapport financier
function calculerRapportFinancier() {
    const totaux = calculerTotaux();

    // Calcul de la moyenne mensuelle
    const maintenant = new Date ();
    const monthAgo = new Date(maintenant);
    monthAgo.setDate(maintenant.getDate() - 30);

    const transactionsDerniersMois = transactions.filter(t => new Date(t.date) >= monthAgo);
    const revenusMois = transactionsDerniersMois
    .filter(t => t.type === 'Revenus')
    .reduce((sum, t) => sum + t.montant, 0);
    const depensesMois = transactionsDerniersMois
    .filter(t => t.type === 'Depenses')
    .reduce((sum, t) => sum + t.montant, 0);

    const moyenneMensuelle = revenusMois - depensesMois;

    // Plus grosse dépense
    const depenses = transactions.filter(t => t.montant === 'Dépenses');
    const maxDepense = depenses.length > 0 ? Math.max(...revenusMois.map(t => t.montant)) : 0;


    // Plus gros revenu
    const revenus = transactions.filter(t => t.type === 'Revenus');
    const maxRevenu = revenus.length > 0 ? Math.max(...revenus.map(t => t.montant)) : 0;

    // Taux d'épargne
    const tauxEpargne = totaux.revenusTotaux > 0 ? (totaux.beneficeNet / totaux.revenusTotaux * 100) : 0;

    // Mise à jour de l'affichage
    document.getElementById('moyenneMensuelle').textContent = formatMontant(moyenneMensuelle);
    document.getElementById('maxDepense').textContent = formatMontant(maxDepense);
    document.getElementById('maxRevenu').textContent = formatMontant(maxRevenu);
    document.getElementById('tauxEpargne').textContent = tauxEpargne.toFixed(1) + '%';
}

function initialiserFiltres () {
    const filtreType = document.getElementById('typesTransactions');
    const filtreCategorie = document.getElementById('catégoriesTransactions');
    const filtrePeriode = document.getElementById('périodesTransactions');
    const optionSalaire = document.querySelector('#catégoriesTransactions option[value = "Salaire"]');

    if(!optionSalaire) {
        const option = document.createElement('option');
        option.value = 'Salaire';
        option.textContent = 'Salaire';
        filtreCategorie.appendChild(option);
    }

    const optionToutesCategories = document.querySelector('#catégoriesTransactions option[value="Toutes catégories"]');
    if (!optionToutesCategories) {
        const option = document.createElement('option');
        option.value = 'Toutes catégories';
        option.textContent = 'Toutes catégories';
        filtreCategorie.insertBefore(option, filtreCategorie.firstChild);
        filtreCategorie.value = 'Toutes catégories';
    }
    
    if (filtreType) {
        filtreType.addEventListener('change', appliquerFiltres);
    }
    if (filtreCategorie) {
        filtreCategorie.addEventListener('change', appliquerFiltres);
    }
    if (filtrePeriode) {
        filtrePeriode.addEventListener('change', appliquerFiltres);
    }
}

function appliquerFiltres() {
    const typeSelectionne = document.getElementById('typesTransactions').value;
    const categorieSelectionnee = document.getElementById('catégoriesTransactions').value;
    const periodeSelectionnee = document.getElementById('périodesTransactions').value;
    
    let transactionsFiltrees = [...transactions];
    
    // Filtre par type
    if (typeSelectionne !== 'Tous les types') {
        transactionsFiltrees = transactionsFiltrees.filter(t => t.type === typeSelectionne);
    }
    
    // Filtre par catégorie
    if (categorieSelectionnee !== 'Toutes catégories') {
        transactionsFiltrees = transactionsFiltrees.filter(t => t.categorie === categorieSelectionnee);
    }
    
    // Filtre par période
    if (periodeSelectionnee !== 'Toutes périodes') {
        const maintenant = new Date();
        let dateDebut;
        
        switch (periodeSelectionnee) {
            case '7 derniers jours':
                dateDebut = new Date(maintenant);
                dateDebut.setDate(maintenant.getDate() - 7);
                break;
            case '30 derniers jours':
                dateDebut = new Date(maintenant);
                dateDebut.setDate(maintenant.getDate() - 30);
                break;
            case '3 derniers mois':
                dateDebut = new Date(maintenant);
                dateDebut.setMonth(maintenant.getMonth() - 3);
                break;
        }
        
        if (dateDebut) {
            transactionsFiltrees = transactionsFiltrees.filter(t => new Date(t.date) >= dateDebut);
        }
    }
    
    // Afficher les transactions filtrées
    afficherTransactions(transactionsFiltrees);
}

// === GESTION DU THÈME DARK/LIGHT ===
function initTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Appliquer le thème sauvegardé
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.checked = savedTheme === 'dark';
    
    // Écouter les changements
    themeSwitch.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        console.log('Thème changé vers:', newTheme);
    });
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function () {
    const aujourdhui = getTodayDate();
    document.getElementById('formulaireCalendrier').value = aujourdhui;
    });

    const formulaire = document.getElementById('transactionFormulaire');
    if (formulaire) {
        formulaire.addEventListener('submit', function(event) {
            event.preventDefault();
            addTransaction(event);
        });
    }
    
    // Alternative: gestion directe du bouton
    const boutonAjouter = document.getElementById('addButton');
    if (boutonAjouter) {
        boutonAjouter.type = 'button'; // Empêcher la soumission automatique
        boutonAjouter.addEventListener('click', function(event) {
            event.preventDefault();
            addTransaction(event);
        });
    }

    const boutonCreerObjectif = document.getElementById('createButton');
    if (boutonCreerObjectif) {
        boutonCreerObjectif.removeAttribute('onclick');
        boutonCreerObjectif.type = 'button';
        boutonCreerObjectif.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            createGoal();
        });
    }
    
    // Gestion du formulaire au cas où
    const formular = document.getElementById('transactionFormulaire');
    if (formulaire) {
        formulaire.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            addTransaction(event);
        });
    }


    calculerTotaux();
    afficherTransactions();
    calculerRapportFinancier();
    initTheme();