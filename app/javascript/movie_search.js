// Configuration API OMDB
const OMDB_CONFIG = {
  baseUrl: "https://www.omdbapi.com/",
  apiKey: "48727053",
  fallbackApiKey: "8691812a"
};

class MovieSearch {
  constructor() {
    this.form = document.getElementById("search-movies");
    this.input = document.getElementById("movie-name");
    this.container = document.getElementById("movie-cards");
    this.debounceTimer = null;

    this.init();
  }

  init() {
    if (!this.form || !this.input || !this.container) {
      console.warn("Éléments de recherche de films non trouvés");
      return;
    }

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Optionnel : recherche en temps réel avec debounce
    // this.input.addEventListener("input", (e) => this.debounceSearch(e));
  }

  debounceSearch(event) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchMovies(event);
    }, 500);
  }

  handleSubmit(event) {
    event.preventDefault();
    clearTimeout(this.debounceTimer);
    this.searchMovies(event);
  }

  async searchMovies(event) {
    const movieName = this.input.value.trim();

    if (!movieName || movieName.length < 2) {
      this.container.innerHTML = "";
      return;
    }

    try {
      this.showLoading();
      const movies = await this.fetchMovies(movieName);
      this.displayMovies(movies);
    } catch (error) {
      this.showError("Erreur lors de la recherche des films");
      console.error("Erreur API OMDB:", error);
    }
  }

  async fetchMovies(query) {
    const url = `${OMDB_CONFIG.baseUrl}?apikey=${OMDB_CONFIG.apiKey}&s=${encodeURIComponent(query)}&type=movie`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.Response === "False") {
        // Si l'erreur est liée à la clé API, essayer avec la clé de secours
        if (data.Error && data.Error.includes("Invalid API key")) {
          console.warn("Clé API principale invalide, utilisation de la clé de secours");
          return this.fetchMoviesWithFallback(query);
        }
        throw new Error(data.Error || "Aucun résultat trouvé");
      }

      return data.Search || [];
    } catch (error) {
      console.error("Erreur avec la clé API principale:", error);
      throw error;
    }
  }

  async fetchMoviesWithFallback(query) {
    const url = `${OMDB_CONFIG.baseUrl}?apikey=${OMDB_CONFIG.fallbackApiKey}&s=${encodeURIComponent(query)}&type=movie`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP avec clé de secours: ${response.status}`);
    }

    const data = await response.json();
    if (data.Response === "False") {
      throw new Error(data.Error || "Aucun résultat trouvé");
    }

    return data.Search || [];
  }

  displayMovies(movies) {
    if (!movies.length) {
      this.container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Aucun film trouvé.</p></div>';
      return;
    }

    const moviesHTML = movies.map(movie => this.createMovieCard(movie)).join("");
    this.container.innerHTML = moviesHTML;
  }

  createMovieCard(movie) {
    const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "/assets/no-poster.jpg";
    const title = this.escapeHtml(movie.Title);
    const year = movie.Year || "N/A";

    return `
      <div class="col-lg-3 col-md-4 col-sm-6 col-12 mb-3">
        <div class="card h-100 movie-card clickable-card"
             data-imdb-id="${movie.imdbID}"
             data-movie-title="${title}"
             data-movie-year="${year}"
             data-movie-poster="${posterUrl}"
             style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
          <img src="${posterUrl}"
               class="card-img-top"
               alt="${title}"
               onerror="this.src='/assets/no-poster.jpg'"
               style="height: 300px; object-fit: cover;"
               loading="lazy">
          <div class="card-body d-flex flex-column">
            <span class="badge bg-primary mb-2 align-self-start">${year}</span>
            <h6 class="card-title" title="${title}">${this.truncateText(title, 50)}</h6>
            <div class="mt-auto">
              <small class="text-muted">
                <i class="fas fa-plus me-1"></i>Cliquez pour ajouter à la liste
              </small>
            </div>
          </div>
          <div class="card-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
               style="background: rgba(0,0,0,0.8); opacity: 0; transition: opacity 0.3s; top: 0; left: 0; border-radius: inherit;">
            <div class="text-white text-center">
              <i class="fas fa-plus fa-3x mb-3"></i>
              <p class="mb-0 fw-bold">Ajouter à ma liste</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="col-12">
        <div class="text-center p-5">
          <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Recherche en cours...</span>
          </div>
          <p class="text-muted">Recherche de films en cours...</p>
        </div>
      </div>`;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center">
          <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
          <p class="mb-0">${message}</p>
        </div>
      </div>`;
  }
}

class BookmarkFormIntegration {
  constructor() {
    this.isProcessing = false;
    this.clickHandler = null;
    this.mouseOverHandler = null;
    this.mouseOutHandler = null;
    this.init();
  }

  init() {
    this.setupEventDelegation();
  }

  // Méthode pour nettoyer les event listeners
  cleanup() {
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.mouseOverHandler) {
      document.removeEventListener('mouseover', this.mouseOverHandler);
    }
    if (this.mouseOutHandler) {
      document.removeEventListener('mouseout', this.mouseOutHandler);
    }
  }

  setupEventDelegation() {
    const findMovieCard = (element) => {
      let current = element;
      while (current && current !== document) {
        if (current.classList && current.classList.contains('clickable-card')) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    // Supprimer les anciens listeners s'ils existent
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.mouseOverHandler) {
      document.removeEventListener('mouseover', this.mouseOverHandler);
    }
    if (this.mouseOutHandler) {
      document.removeEventListener('mouseout', this.mouseOutHandler);
    }

    // Créer les handlers avec bind pour pouvoir les supprimer plus tard
    this.clickHandler = (e) => {
      const movieCard = findMovieCard(e.target);
      if (movieCard && !this.isProcessing && movieCard.dataset.processing !== 'true') {
        this.handleMovieCardClick(movieCard, e);
      }
    };

    this.mouseOverHandler = (e) => {
      const movieCard = findMovieCard(e.target);
      if (movieCard && !movieCard.dataset.hovered && movieCard.dataset.processing !== 'true') {
        movieCard.dataset.hovered = 'true';
        this.showHoverEffect(movieCard);
      }
    };

    this.mouseOutHandler = (e) => {
      const movieCard = findMovieCard(e.target);
      if (movieCard && movieCard.dataset.hovered) {
        const relatedTarget = e.relatedTarget;
        const isLeavingCard = !relatedTarget || !findMovieCard(relatedTarget) ||
                             findMovieCard(relatedTarget) !== movieCard;

        if (isLeavingCard) {
          delete movieCard.dataset.hovered;
          this.hideHoverEffect(movieCard);
        }
      }
    };

    // Ajouter les nouveaux listeners
    document.addEventListener('click', this.clickHandler, { passive: false });
    document.addEventListener('mouseover', this.mouseOverHandler, { passive: true });
    document.addEventListener('mouseout', this.mouseOutHandler, { passive: true });
  }

  showHoverEffect(card) {
    card.style.transform = 'translateY(-8px) scale(1.02)';
    card.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';

    const overlay = card.querySelector('.card-overlay');
    if (overlay) {
      overlay.style.opacity = '1';
    }
  }

  hideHoverEffect(card) {
    card.style.transform = 'translateY(0) scale(1)';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    const overlay = card.querySelector('.card-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
    }
  }

  async handleMovieCardClick(movieCard, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); // Empêche les autres handlers

    // Vérifier si on est déjà en train de traiter cette carte
    if (this.isProcessing || movieCard.dataset.processing === 'true') {
      console.log('Traitement déjà en cours, ignorer le clic');
      return;
    }

    // Marquer la carte comme en cours de traitement
    movieCard.dataset.processing = 'true';

    const movieData = {
      imdbId: movieCard.dataset.imdbId,
      title: movieCard.dataset.movieTitle,
      year: movieCard.dataset.movieYear,
      poster: movieCard.dataset.moviePoster
    };

    console.log('Film sélectionné:', movieData);

    try {
      // Récupérer les détails complets du film depuis OMDB
      const fullMovieData = await this.fetchMovieDetails(movieData.imdbId);

      const result = await this.promptForComment(fullMovieData);
      if (result === null) {
        return; // L'utilisateur a annulé
      }

      // Le résultat contient maintenant listId et comment
      await this.addMovieToList(fullMovieData, result.comment, result.listId);
    } catch (error) {
      console.error('Erreur lors du clic sur la carte:', error);
      this.showErrorMessage('Erreur lors de l\'ajout du film');
    } finally {
      // Retirer le marqueur de traitement
      if (movieCard && movieCard.dataset) {
        delete movieCard.dataset.processing;
      }
    }
  }

  async fetchMovieDetails(imdbId) {
    try {
      const url = `${OMDB_CONFIG.baseUrl}?apikey=${OMDB_CONFIG.apiKey}&i=${imdbId}&plot=short`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.Response === "False") {
        throw new Error(data.Error || "Film non trouvé");
      }

      return {
        imdbId: data.imdbID,
        title: data.Title,
        year: data.Year,
        poster: data.Poster !== "N/A" ? data.Poster : "/assets/no-poster.jpg",
        plot: data.Plot !== "N/A" ? data.Plot : `Film de ${data.Year}`,
        director: data.Director !== "N/A" ? data.Director : "",
        actors: data.Actors !== "N/A" ? data.Actors : "",
        genre: data.Genre !== "N/A" ? data.Genre : "",
        imdbRating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : 0,
        runtime: data.Runtime !== "N/A" ? data.Runtime : ""
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      // En cas d'erreur, retourner les données basiques
      return {
        imdbId: imdbId,
        title: "Film sans détails",
        year: "N/A",
        poster: "/assets/no-poster.jpg",
        plot: "Détails non disponibles",
        director: "",
        actors: "",
        genre: "",
        imdbRating: 0,
        runtime: ""
      };
    }
  }

  async promptForComment(movieData) {
    return new Promise(async (resolve) => {
      // Supprimer toute modal existante
      const existingModal = document.getElementById('commentModal');
      if (existingModal) {
        existingModal.remove();
      }

      // Récupérer les listes de l'utilisateur
      let userLists = [];
      try {
        userLists = await this.fetchUserLists();
      } catch (error) {
        console.error('Erreur lors de la récupération des listes:', error);
        this.showErrorMessage('Impossible de récupérer vos listes');
        resolve(null);
        return;
      }

      if (userLists.length === 0) {
        this.showErrorMessage('Vous devez d\'abord créer une liste');
        resolve(null);
        return;
      }

      const modalHTML = `
        <div class="modal fade" id="commentModal" tabindex="-1" aria-labelledby="commentModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="commentModalLabel">Ajouter "${movieData.title}" à une liste</h5>
                <button type="button" class="btn-close" aria-label="Fermer"></button>
              </div>
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-4">
                    <img src="${movieData.poster}"
                         class="img-fluid rounded shadow"
                         alt="Affiche de ${movieData.title}"
                         onerror="this.src='/assets/no-poster.jpg'">
                  </div>
                  <div class="col-md-8">
                    <h6 class="fw-bold">${movieData.title} (${movieData.year})</h6>

                    ${movieData.genre ? `<p class="text-muted mb-2"><strong>Genre:</strong> ${movieData.genre}</p>` : ''}
                    ${movieData.director ? `<p class="text-muted mb-2"><strong>Réalisateur:</strong> ${movieData.director}</p>` : ''}
                    ${movieData.runtime ? `<p class="text-muted mb-2"><strong>Durée:</strong> ${movieData.runtime}</p>` : ''}
                    ${movieData.imdbRating > 0 ? `<p class="text-muted mb-2"><strong>Note IMDB:</strong> ${movieData.imdbRating}/10</p>` : ''}

                    <p class="text-muted mb-3 small">${movieData.plot}</p>

                    <!-- Sélection de la liste -->
                    <div class="mb-3">
                      <label for="listSelect" class="form-label fw-bold">Choisir une liste</label>
                      <select class="form-select" id="listSelect" required>
                        <option value="">-- Sélectionnez une liste --</option>
                        ${userLists.map(list => `<option value="${list.id}">${list.name}</option>`).join('')}
                      </select>
                      <div class="invalid-feedback">Veuillez sélectionner une liste.</div>
                    </div>

                    <div class="mb-3">
                      <label for="movieComment" class="form-label fw-bold">Pourquoi voulez-vous voir ce film ?</label>
                      <textarea class="form-control" id="movieComment" rows="4"
                                placeholder="Exprimez vos motivations, vos attentes, ou pourquoi ce film vous intéresse..."
                                required aria-describedby="commentHelp"></textarea>
                      <div class="invalid-feedback">Le commentaire doit contenir au moins 6 caractères.</div>
                      <div id="commentHelp" class="form-text">Minimum 6 caractères</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelBtn">
                  <i class="fas fa-times me-1"></i>Annuler
                </button>
                <button type="button" class="btn btn-primary" id="confirmAdd" disabled>
                  <i class="fas fa-plus me-1"></i>Ajouter à la liste
                </button>
              </div>
            </div>
          </div>
        </div>`;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modalElement = document.getElementById('commentModal');
      const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: true,
        focus: true
      });

      const commentInput = document.getElementById('movieComment');
      const listSelect = document.getElementById('listSelect');
      const confirmBtn = document.getElementById('confirmAdd');
      const cancelBtn = document.getElementById('cancelBtn');
      let isResolved = false;

      // Fonction de nettoyage sécurisée
      const cleanup = () => {
        try {
          const activeElement = document.activeElement;
          if (modalElement && modalElement.contains(activeElement)) {
            document.body.focus();
          }

          if (modalElement && modalElement.parentNode) {
            modalElement.remove();
          }
        } catch (error) {
          console.warn('Erreur lors du nettoyage de la modal:', error);
        }
      };

      // Fonction pour fermer la modal proprement
      const closeModal = (result = null) => {
        if (isResolved) return;

        isResolved = true;

        const focusedElement = modalElement.querySelector(':focus');
        if (focusedElement) {
          focusedElement.blur();
        }

        modal.hide();
        resolve(result);
      };

      // Fonction de validation
      const validateForm = () => {
        const comment = commentInput.value.trim();
        const selectedList = listSelect.value;

        const isCommentValid = comment.length >= 6;
        const isListValid = selectedList !== '';

        commentInput.classList.toggle('is-invalid', !isCommentValid);
        listSelect.classList.toggle('is-invalid', !isListValid);

        confirmBtn.disabled = !(isCommentValid && isListValid);

        return { isCommentValid, isListValid, comment, selectedList };
      };

      // Événements de la modal
      modalElement.addEventListener('shown.bs.modal', () => {
        try {
          listSelect.focus();
        } catch (error) {
          console.warn('Erreur lors du focus:', error);
        }
      });

      modalElement.addEventListener('hidden.bs.modal', () => {
        setTimeout(cleanup, 150);
      });

      // Gestion du bouton de confirmation
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const validation = validateForm();

        if (validation.isCommentValid && validation.isListValid) {
          closeModal({
            listId: validation.selectedList,
            comment: validation.comment
          });
        } else {
          // Focus sur le premier champ invalide
          if (!validation.isListValid) {
            listSelect.focus();
          } else if (!validation.isCommentValid) {
            commentInput.focus();
          }
        }
      });

      // Gestion du bouton d'annulation
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(null);
      });

      // Gestion du bouton de fermeture (X)
      const closeButton = modalElement.querySelector('.btn-close');
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(null);
      });

      // Gestion de la touche Échap
      modalElement.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal(null);
        }
      });

      // Validation en temps réel pour le commentaire
      commentInput.addEventListener('input', () => {
        const currentLength = commentInput.value.trim().length;
        const formText = modalElement.querySelector('#commentHelp');
        formText.textContent = `${currentLength}/6 caractères minimum`;
        formText.className = currentLength >= 6 ? 'form-text text-success' : 'form-text';

        validateForm();
      });

      // Validation en temps réel pour la liste
      listSelect.addEventListener('change', validateForm);

      // Permettre la validation par Entrée
      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          const validation = validateForm();
          if (validation.isCommentValid && validation.isListValid) {
            closeModal({
              listId: validation.selectedList,
              comment: validation.comment
            });
          }
        }
      });

      // Afficher la modal
      try {
        modal.show();
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la modal:', error);
        cleanup();
        resolve(null);
      }
    });
  }

  async fetchUserLists() {
    try {
      const response = await fetch('/lists.json', {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des listes:', error);
      throw error;
    }
  }

  async addMovieToList(movieData, comment, listId) {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      this.showProcessingState();

      console.log('Création du film avec données complètes:', movieData);
      const movie = await this.createMovie(movieData);
      console.log('Film créé/récupéré:', movie);

      console.log('Création du bookmark pour la liste:', listId);
      const bookmark = await this.createBookmark(movie.id, comment, listId);
      console.log('Bookmark créé:', bookmark);

      this.showSuccessMessage(movieData.title);

      // Nettoyer l'interface
      this.clearSearchResults();

      // Rediriger vers la liste après un délai
      setTimeout(() => {
        window.location.href = `/lists/${listId}`;
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      this.showErrorMessage(`Erreur: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async createMovie(movieData) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (!csrfToken) {
      throw new Error('Token CSRF non trouvé');
    }

    const moviePayload = {
      title: movieData.title,
      overview: movieData.plot,
      poster_url: movieData.poster,
      rating: movieData.imdbRating,
      imdb_id: movieData.imdbId
    };

    console.log('Envoi payload:', moviePayload);

    const response = await fetch('/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ movie: moviePayload })
    });

    console.log('Réponse création film:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse film:', errorText);
      throw new Error(`Erreur lors de la création du film (${response.status})`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Réponse du serveur non-JSON pour la création du film');
    }

    return await response.json();
  }

  async createBookmark(movieId, comment, listId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (!listId) {
      throw new Error('ID de liste non fourni');
    }

    if (!csrfToken) {
      throw new Error('Token CSRF non trouvé');
    }

    console.log('Création bookmark pour liste:', listId, 'film:', movieId);

    // Essayer d'abord avec JSON
    try {
      const payload = {
        bookmark: {
          movie_id: parseInt(movieId),
          comment: comment
        }
      };

      console.log('Tentative avec JSON payload:', payload);

      const response = await fetch(`/lists/${listId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Réponse JSON:', response.status, response.statusText);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return { success: true, movie_id: movieId };
        }
      }

      // Si JSON échoue avec 406, essayer avec FormData
      if (response.status === 406) {
        console.log('JSON refusé, tentative avec FormData...');
        return await this.createBookmarkWithFormData(movieId, comment, listId, csrfToken);
      }

      // Autres erreurs
      const errorText = await response.text();
      console.error('Erreur réponse JSON:', errorText);
      throw new Error(`Erreur lors de la création du bookmark (${response.status})`);

    } catch (error) {
      if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
        console.log('Erreur 406, tentative avec FormData...');
        return await this.createBookmarkWithFormData(movieId, comment, listId, csrfToken);
      }
      throw error;
    }
  }

  async createBookmarkWithFormData(movieId, comment, listId, csrfToken) {
    console.log('Création bookmark avec FormData pour liste:', listId, 'film:', movieId);

    const formData = new FormData();
    formData.append('bookmark[movie_id]', movieId);
    formData.append('bookmark[comment]', comment);

    const response = await fetch(`/lists/${listId}/bookmarks`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json, text/html'
      },
      body: formData
    });

    console.log('Réponse FormData:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse FormData:', errorText);
      throw new Error(`Erreur lors de la création du bookmark avec FormData (${response.status})`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Réponse HTML - probablement une redirection ou un succès
      console.log('Réponse HTML reçue, considérée comme succès');
      return { success: true, movie_id: movieId };
    }
  }

  extractListId() {
    console.log('=== DEBUG extractListId ===');

    // 1. Chercher dans l'attribut data-list-id
    const listElement = document.querySelector('[data-list-id]');
    console.log('Element avec data-list-id:', listElement);
    if (listElement) {
      console.log('Dataset listId:', listElement.dataset.listId);
      console.log('Attribut data-list-id:', listElement.getAttribute('data-list-id'));
    }

    if (listElement && listElement.dataset.listId) {
      console.log('✅ ID trouvé dans data-list-id:', listElement.dataset.listId);
      return listElement.dataset.listId;
    }

    // 2. Chercher dans l'URL
    const url = window.location.pathname + window.location.search;
    console.log('URL complète:', url);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);

    const patterns = [
      /\/lists\/(\d+)/,
      /list_id=(\d+)/,
    ];

    for (const pattern of patterns) {
      console.log('Test pattern:', pattern);
      const match = url.match(pattern);
      console.log('Match result:', match);
      if (match) {
        console.log('✅ ID trouvé dans URL:', match[1]);
        return match[1];
      }
    }

    // 3. Chercher dans un champ caché
    const hiddenListId = document.querySelector('input[name="list_id"]');
    console.log('Champ caché list_id:', hiddenListId);
    if (hiddenListId) {
      console.log('Valeur du champ caché:', hiddenListId.value);
    }

    if (hiddenListId && hiddenListId.value) {
      console.log('✅ ID trouvé dans champ caché:', hiddenListId.value);
      return hiddenListId.value;
    }

    // 4. Chercher dans les paramètres URL avec URLSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const listIdFromParams = urlParams.get('list_id');
    console.log('URLSearchParams list_id:', listIdFromParams);
    if (listIdFromParams) {
      console.log('✅ ID trouvé dans URLSearchParams:', listIdFromParams);
      return listIdFromParams;
    }

    // 5. Essayer de trouver dans d'autres éléments du DOM
    console.log('=== Recherche alternative ===');

    // Chercher dans les liens de retour
    const backLinks = document.querySelectorAll('a[href*="/lists/"]');
    console.log('Liens vers les listes:', backLinks);
    for (const link of backLinks) {
      const href = link.getAttribute('href');
      console.log('Href du lien:', href);
      const match = href.match(/\/lists\/(\d+)/);
      if (match) {
        console.log('✅ ID trouvé dans lien de retour:', match[1]);
        return match[1];
      }
    }

    // Chercher dans les formulaires
    const forms = document.querySelectorAll('form');
    console.log('Formulaires trouvés:', forms.length);
    for (const form of forms) {
      const action = form.getAttribute('action');
      console.log('Action du formulaire:', action);
      if (action) {
        const match = action.match(/\/lists\/(\d+)/);
        if (match) {
          console.log('✅ ID trouvé dans action du formulaire:', match[1]);
          return match[1];
        }
      }
    }

    console.error('❌ Aucun ID de liste trouvé');
    console.log('=== Fin DEBUG ===');
    return null;
  }

  clearSearchResults() {
    const searchResults = document.getElementById('movie-cards');
    const searchInput = document.getElementById('movie-name');

    if (searchResults) {
      searchResults.innerHTML = '';
    }
    if (searchInput) {
      searchInput.value = '';
    }
  }

  showProcessingState() {
    this.showToast('Ajout en cours...', 'info', '<div class="spinner-border spinner-border-sm me-2"></div>');
  }

  showSuccessMessage(movieTitle) {
    this.showToast(`"${movieTitle}" a été ajouté à votre liste !`, 'success', '<i class="fas fa-check me-2"></i>');
  }

  showErrorMessage(message) {
    this.showToast(message, 'danger', '<i class="fas fa-exclamation-triangle me-2"></i>');
  }

  showToast(message, type = 'info', icon = '') {
    // Supprimer les anciens toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());

    const toastHTML = `
      <div class="toast align-items-center text-white bg-${type} border-0 position-fixed"
           style="top: 20px; right: 20px; z-index: 1060;" role="alert" data-bs-autohide="true" data-bs-delay="5000">
        <div class="d-flex">
          <div class="toast-body">
            ${icon}${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.querySelector('.toast:last-of-type');
    const toast = new bootstrap.Toast(toastElement);

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });

    toast.show();
  }
}

// Gestion de l'initialisation
class AppInitializer {
  constructor() {
    this.movieSearchInstance = null;
    this.bookmarkIntegrationInstance = null;
  }

  initialize() {
    console.log('Initialisation des composants...');

    if (!this.movieSearchInstance) {
      this.movieSearchInstance = new MovieSearch();
    }
    if (!this.bookmarkIntegrationInstance) {
      this.bookmarkIntegrationInstance = new BookmarkFormIntegration();
    }
  }

  reinitialize() {
    console.log('Réinitialisation des composants...');

    // Nettoyer les anciens event listeners
    if (this.bookmarkIntegrationInstance && this.bookmarkIntegrationInstance.cleanup) {
      this.bookmarkIntegrationInstance.cleanup();
    }

    // Réinitialiser les instances
    this.movieSearchInstance = null;
    this.bookmarkIntegrationInstance = null;

    // Petit délai pour s'assurer que le nettoyage est terminé
    setTimeout(() => {
      this.initialize();
    }, 100);
  }
}

// Instance globale
const appInitializer = new AppInitializer();

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  appInitializer.initialize();
});

// Pour Rails Turbo
document.addEventListener('turbo:load', () => {
  appInitializer.reinitialize();
});
