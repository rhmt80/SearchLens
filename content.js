const isLocal = false;
let isDarkMode = false;
let linkColorDark = '#99c3ff';
let linkColorLight = 'blue';

function applyDarkModeStyles() {
    const sidebar = document.getElementById('custom-sidebar');
    if (!sidebar) return;

    isDarkMode = true;

    sidebar.style.backgroundColor = '#333';
    sidebar.style.color = '#fff';
    sidebar.style.border = '1px solid #444';

    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
        link.style.color = '#99c3ff';
    });

    const madeBySection = sidebar.querySelector('div');
    if (madeBySection) {
        madeBySection.style.color = '#bbb';
    }
}

function applyLightModeStyles() {
    const sidebar = document.getElementById('custom-sidebar');
    if (!sidebar) return;

    isDarkMode = false;

    sidebar.style.backgroundColor = '#fafafa';
    sidebar.style.color = '#4d5156';
    sidebar.style.border = '1px solid #ccc';

    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
        link.style.color = 'blue';
    });

    const madeBySection = sidebar.querySelector('div');
    if (madeBySection) {
        madeBySection.style.color = '#888';
    }
}

function applyColorScheme() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeMediaQuery.matches) {
        applyDarkModeStyles();
    } else {
        applyLightModeStyles();
    }
}

function detectColorScheme() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeMediaQuery.matches) {
        applyDarkModeStyles();
    } else {
        applyLightModeStyles();
    }

    darkModeMediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            applyDarkModeStyles();
        } else {
            applyLightModeStyles();
        }
    });
}

function isSearchEnabled() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('searchEnabled', (data) => {
            resolve(data.searchEnabled !== false);
        });
    });
}

function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'custom-sidebar';
    sidebar.style.position = 'absolute';
    sidebar.style.top = '150px';
    sidebar.style.right = '50px';
    sidebar.style.width = '400px';
    sidebar.style.padding = '10px';
    sidebar.style.backgroundColor = '#fafafa';
    sidebar.style.border = '1px solid #ccc';
    sidebar.style.zIndex = '127';
    sidebar.style.color = '#4d5156';
    sidebar.style.lineHeight = '1.3';
    sidebar.style.overflowY = 'auto';
    sidebar.style.height = 'fit-content';
    sidebar.style.opacity = '0.95';

    const closeButton = document.createElement('button');
    closeButton.innerText = '✖';
    closeButton.style.float = 'right';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
        sidebar.style.display = 'none';
    });

    sidebar.appendChild(closeButton);

    const websiteContainer = document.createElement('div');
    websiteContainer.id = 'website-container';
    websiteContainer.style.marginTop = '3px';
    
    sidebar.appendChild(websiteContainer);

    const style = document.createElement('style');
    style.innerHTML = `
    .anchor-offset {
        scroll-margin-top: 70px;
    }
    `;
    document.head.appendChild(style);

    const resultsList = document.createElement('ul');
    resultsList.id = 'results-list';
    resultsList.style.listStyleType = 'none';
    sidebar.appendChild(resultsList);

    const madeBySection = document.createElement('div');
    madeBySection.style.marginTop = '20px';
    madeBySection.style.textAlign = 'center';
    madeBySection.style.fontSize = '14px';
    madeBySection.style.color = '#888';
    madeBySection.style.fontFamily = 'sans-serif';
    madeBySection.innerHTML = `SearchLens is made by <a href="https://x.com/rambo_rhmt" target="_blank">Rehmat Singh Chawla(@rambo_rhmt)</a>`;

    sidebar.appendChild(madeBySection);

    document.body.appendChild(sidebar);
}

function hideSidebarStuff() {
    const resultsList = document.getElementById('results-list');
    resultsList.style.filter = "blur(2px)";
}

function unblurResults() {
    const resultsList = document.getElementById('results-list');
    resultsList.style.filter = "blur(0px)";
}

function updateSidebar(results) {
    const resultsList = document.getElementById('results-list');
    if (resultsList) {
        resultsList.innerHTML = '';
        let i = 1;
        results.forEach(result => {
            const listItem = document.createElement('li');
            listItem.style.marginTop = '10px';
            listItem.innerHTML = `
            <a id="result-${i}" class="anchor-offset" name="result-${i}"></a>
            <span style='font-size: 16px;'>[${i++}] <a href="${result.link}" style="color: ${isDarkMode ? linkColorDark : linkColorLight}; font-weight: 600" target="_blank">${result.title}</a></span>
            <p style="margin-top:5px">${result.description}</p>
            `;
            resultsList.appendChild(listItem);
        });
    }
}

function parseSearchResults(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const searchResults = doc.querySelectorAll('.g');
    const results = Array.from(searchResults).map(result => {
        const titleElement = result.querySelector('h3');
        const linkElement = result.querySelector('a');
        const descriptionElement = result.querySelectorAll("span");

        const title = titleElement ? titleElement.textContent : '';
        const link = linkElement ? linkElement.href : '';
        const description = (descriptionElement.length != 0) ? descriptionElement[descriptionElement.length-1].textContent : '';

        return { title, link, description };
    });

    return results;
}

async function updateSidebarWithResponse(response) {
    if (response && response.html) {
        const html = response.html;
        const results = parseSearchResults(html);
        updateSidebar(results);
    } else {
        console.log('No results found.');
    }
}

window.addEventListener('load', async () => {
    const searchEnabled = await isSearchEnabled();
    if (!searchEnabled) {
        console.log("Search disabled");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchDiv = document.querySelector("div#search");
    if (!searchDiv) {
        console.log('Disabling sidebar on non-text search results page');
        return;
    }

    createSidebar();
    detectColorScheme();

    const searchInput = document.querySelector('input[name="q"]');
    const searchQuery = searchInput.value;

    chrome.storage.sync.get('preferredWebsites', (data) => {
        const websites = data.preferredWebsites || ['reddit.com', 'ycombinator.com','x.com'];
        const websiteContainer = document.getElementById('website-container');

        websites.forEach((website, index) => {
            const websiteLink = document.createElement('a');
            websiteLink.href = '#';
            websiteLink.textContent = website;
            websiteLink.addEventListener('click', async (event) => {
                event.preventDefault();
                hideSidebarStuff();
                const response = await chrome.runtime.sendMessage({
                    action: 'performSearch',
                    query: searchQuery,
                    website: website
                });
                unblurResults();
                updateSidebarWithResponse(response);

                const allWebsiteLinks = websiteContainer.querySelectorAll('a');
                allWebsiteLinks.forEach(link => {
                    link.style.fontWeight = 'normal';
                    link.style.textDecoration = 'underline';
                    link.style.color = isDarkMode ? linkColorDark : linkColorLight;
                });

                websiteLink.style.fontWeight = 'bold';
                websiteLink.style.textDecoration = 'none';
                websiteLink.style.color = isDarkMode ? "#fff" : "black";
                websiteLink.style.cursor = 'pointer';
            });

            websiteContainer.appendChild(websiteLink);

            if (index < websites.length - 1) {
                const separator = document.createTextNode(' | ');
                websiteContainer.appendChild(separator);
            }
            if (index === 0) {
                websiteLink.click();
            }
        });
    });
});
