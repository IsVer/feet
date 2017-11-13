/* Functional, Memoized, cached, and object-oriented spotify search. written in vanilla js.
 */


function searchLibrary(query) {
    //if the result is cached, return it.
    searchLibrary.cache = searchLibrary.cache || {};
    if (searchLibrary.cache[encodeURIComponent(query)]) {
        return writeResults(searchLibrary.cache[encodeURIComponent(query)]);
    }
    //otherwise create an ajax promise
    makeNetworkRequest(query).then(function(response) {
        searchLibrary.cache[encodeURIComponent(query)] = response;
        writeResults(response);
    }, function(e) {
        console.error(e)
    });

}

function writeResults(results) {
    let output = document.getElementById("results");
    output.innerHTML = "";

    for (let resultType in JSON.parse(results)) {
        let items = JSON.parse(results)[resultType].items;
        let update = new resultList(resultType, items).render();
        let domElement = document.getElementsByClassName(resultType);
        output.appendChild(update);
    }
}


function makeNetworkRequest(query) {
    return new Promise(function(resolve, reject) {
        let API_URL = "https://api.spotify.com/v1/search?limit=3&type=artist,track,album,playlist&q=" + encodeURI(query);
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                resolve(xhr.responseText);
            }
        };
        xhr.onerror = function() {
            reject(new Error("network error"))
        };
        xhr.open("GET", API_URL, true);
        xhr.send();
    });
}


function listItem() {
    this.render = function() {
        let li = document.createElement("li");
        let divImage = document.createElement("figure");
        let divImageWrap = document.createElement("div");
        let divDesc = document.createElement("div");
        let img = document.createElement("img");
        let title = document.createElement("p");
        let subtitle = document.createElement("p");
        let anchor = document.createElement("a");
        let imgAnchor = document.createElement("a");
        img.src = this.src === 0 ? "https://samratcliffe.github.io/images/placeholder.jpg" : this.src;
        anchor.href = imgAnchor.href = this.href;
        anchor.target = imgAnchor.target = "_blank";
        title.classList.add("item-title");
        subtitle.classList.add("item-subtitle");
        title.innerHTML = this.title;
        subtitle.innerHTML = this.subtitle;
        imgAnchor.appendChild(img);
        divImageWrap.appendChild(imgAnchor);
        divDesc.appendChild(title);
        divDesc.appendChild(subtitle);
        divDesc.appendChild(anchor);
        divImage.appendChild(divImageWrap);
        li.appendChild(divImage);
        li.appendChild(divDesc);
        return li;
    }
}

function resultListItem(resultItem) {
    this.title = "<a target='_blank' href='" + resultItem.external_urls.spotify + "'>" + (resultItem.name.length > 45 ? resultItem.name.substr(0, 45) + "…" : resultItem.name) + "</a>";
    this.href = resultItem.external_urls.spotify;
    switch (resultItem.type) {
        case "artist":
            this.subtitle = Number(resultItem.followers.total).toLocaleString() + " listeners";
            this.src = resultItem.images.length && resultItem.images.slice(-1)[0].url;
            break;
        case "album":
            this.subtitle = resultItem.album_type;
            this.src = resultItem.images.length && resultItem.images.slice(1)[0].url;
            break;
        case "track":
            this.subtitle = "<a target='_blank'  href='" + resultItem.artists[0].external_urls.spotify + "'>" + resultItem.artists[0].name + "</a>" + " • " + "<a target='_blank' href='" + resultItem.album.external_urls.spotify + "'>" + resultItem.album.name + "</a>";
            this.src = resultItem.album.images.length && resultItem.album.images.slice(-1)[0].url;
            break;
        case "playlist":
            this.subtitle = resultItem.type;
            this.src = 0;
            break;
        default:
            this.subtitle = resultItem.type;
            break;
    }
}
resultListItem.prototype = new listItem();

function resultList(name, results) {
    this.name = name;
    this.results = results;
    //render
    this.render = function() {
        let ul = document.createElement("ul");
        let headerWrap = document.createElement("div");
        let titleWrap = document.createElement("div");
        let showMoreWrap = document.createElement("div");
        titleWrap.classList.add("title-wrap");
        showMoreWrap.classList.add("show-more-wrap");
        ul.classList.add(this.name);
        let showMore = document.createElement("a");
        showMore.innerHTML = "SHOW MORE";
        showMore.href = "javascript:void(0)";
        let header = document.createElement("p");
        header.innerHTML = this.name;
        titleWrap.appendChild(header);
        showMoreWrap.appendChild(showMore);
        headerWrap.appendChild(titleWrap);
        headerWrap.appendChild(showMoreWrap);
        ul.appendChild(headerWrap)
        this.results.map(function(item) {
            let li = new resultListItem(item);
            ul.appendChild(li.render());
        });
        return ul;
    }
}

let search = document.getElementsByClassName("query-input")[0];

search.addEventListener("keyup", function(e) {
    let query = e.target.value;
    let results = document.getElementById("results");
    results.classList = query === "" ? "" : "active";
    searchLibrary(query);
});
search.addEventListener("focus", function(e) {
    let main = document.getElementsByClassName("main")[0];
    main.classList = "main";
});

//cancel on X click or ESC
let cancel = document.getElementsByClassName("cancel")[0];
cancel.addEventListener("click", cancelInput);

document.onkeydown = function(e) {
    e = e || window.event;
    let isEscape = false;
    if ("key" in e) {
        isEscape = e.key === "Escape";
    } else {
        isEscape = e.keyCode === 27;
    }
    if (isEscape) cancelInput();
};

function cancelInput() {
    let main = document.getElementsByClassName("main")[0];
    main.classList.add("inactive");
    search.value = '';
    document.getElementById("results").remove();
    search.blur();
}