// ARQUIVO: src/js/articles.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const resultsContainer = document.getElementById('results-container');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const paginationFooter = document.getElementById('pagination-footer');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    // --- Configuração e Estado ---
    const NEWS_API_KEY = 'pub_f3dda2c85dbd40198514f5f3e531ea09'; // ⚠️ COLE SUA CHAVE AQUI!
    let state = {
        isLoading: false,
        query: 'saúde mental',
        currentPageToken: null,
        nextPageToken: null,
        pageHistory: [null], // Armazena o token de cada página para a função "Anterior"
        pageNumber: 1,
    };

    const showLoading = () => {
        paginationFooter.classList.remove('visible');
        resultsContainer.innerHTML = `
            <div class="spinner-wrapper">
                <div class="spinner"></div>
            </div>`;
    };

    const showError = (message) => {
        paginationFooter.classList.remove('visible');
        resultsContainer.innerHTML = `<p class="info-text">${message}</p>`;
    };

    const showArticles = (articles) => {
        if (!Array.isArray(articles) || articles.length === 0) {
            showError(`Nenhum artigo encontrado para "${state.query}".`);
            return;
        }

        resultsContainer.innerHTML = ''; // Limpa antes de adicionar novos
        articles.forEach(article => {
            if (!article.title || !article.link) return;
            const articleCard = document.createElement('a');
            articleCard.className = 'article-card';
            articleCard.href = article.link;
            articleCard.target = '_blank';
            articleCard.rel = 'noopener noreferrer';
            articleCard.innerHTML = `
                <img src="${article.image_url || 'https://via.placeholder.com/400x180/4E4E4E/FFFFFF?text=Sem+Imagem'}" alt="" loading="lazy" onerror="this.style.display='none'">
                <div class="article-content">
                    <h3>${article.title}</h3>
                    <p class="article-source">${article.source_id || 'Fonte desconhecida'}</p>
                </div>`;
            resultsContainer.appendChild(articleCard);
        });
        updatePaginationUI();
    };
    
    // --- Controle da Paginação ---
    const updatePaginationUI = () => {
        paginationFooter.classList.add('visible');
        pageInfo.textContent = `Página ${state.pageNumber}`;
        prevPageBtn.disabled = state.pageNumber === 1;
        nextPageBtn.disabled = !state.nextPageToken;
    };


    // --- Lógica da API ---
    const fetchArticles = async () => {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        // Constrói a URL da API
        let apiUrl = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(state.query)}&language=pt`;
        if (state.currentPageToken) {
            apiUrl += `&page=${state.currentPageToken}`;
        }
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.results?.message || 'Erro ao conectar com a API.');
            }

            state.nextPageToken = data.nextPage || null;
            showArticles(data.results);

        } catch (error) {
            if (error.message.includes('API key')) {
                showError('Chave de API inválida. Verifique o código.');
            } else {
                showError('Não foi possível carregar as notícias. Tente mais tarde.');
            }
            console.error('Falha na busca:', error);
        } finally {
            state.isLoading = false;
        }
    };

    // --- Manipuladores de Eventos ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newQuery = searchInput.value.trim();
        if (newQuery && newQuery !== state.query) {
            // Reinicia o estado para uma nova busca
            state.query = newQuery;
            state.currentPageToken = null;
            state.pageHistory = [null];
            state.pageNumber = 1;
            fetchArticles();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (state.nextPageToken) {
            state.pageNumber++;
            state.pageHistory.push(state.nextPageToken);
            state.currentPageToken = state.nextPageToken;
            fetchArticles();
        }
    });

    prevPageBtn.addEventListener('click', () => {
        if (state.pageNumber > 1) {
            state.pageNumber--;
            state.pageHistory.pop(); // Remove a página atual do histórico
            state.currentPageToken = state.pageHistory[state.pageHistory.length - 1]; // Pega a anterior
            fetchArticles();
        }
    });

    // --- Início do Processo ---
    if (NEWS_API_KEY !== 'pub_f3dda2c85dbd40198514f5f3e531ea09') {
        showError('⚠️ Configure sua chave de API no arquivo "articles.js" para começar.');
    } else {
        fetchArticles(); // Busca inicial
    }
});