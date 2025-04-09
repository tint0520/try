
const stores = [
  {
    id: 1,
    name: "粉嫩小舖 台北店",
    position: { lat: 25.0522, lng: 121.5353 },
    color: "#ffb6c1"
  },
  {
    id: 2,
    name: "優雅手作 台中店",
    position: { lat: 24.1477, lng: 120.6736 },
    color: "#add8e6"
  },
  {
    id: 3,
    name: "甜心選物 高雄店",
    position: { lat: 22.662, lng: 120.302 },
    color: "#dda0dd"
  }
];

let map;
let markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: stores[0].position,
    zoom: 12,
    gestureHandling: "greedy",
  });

  const cardContainer = document.getElementById("cardContainer");

  stores.forEach((store, index) => {
    const marker = new google.maps.Marker({
      position: store.position,
      map,
      title: store.name,
      icon: getMarkerIcon(false),
    });

    markers.push(marker);

    marker.addListener("click", () => {
      scrollToCard(index);
      highlightMarker(index);
    });

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" style="background-color:${store.color}"></div>
      <button class="close-btn">×</button>
      <div class="card-body">
        <h3>${store.name}</h3>
        <p>這是一家假店家，用來展示滑動與互動。</p>
      </div>
    `;

    card.querySelector(".close-btn").onclick = () => {
      card.classList.remove("expanded");
    };

    card.onclick = () => {
      document.querySelectorAll(".card").forEach(c => c.classList.remove("expanded"));
      card.classList.add("expanded");
      map.panTo(store.position);
      highlightMarker(index);
    };

    cardContainer.appendChild(card);
  });

  cardContainer.addEventListener("scroll", () => {
    const cards = document.querySelectorAll(".card");
    let closestIndex = 0;
    let closestOffset = Infinity;

    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const offset = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
      if (offset < closestOffset) {
        closestOffset = offset;
        closestIndex = i;
      }
    });

    map.panTo(stores[closestIndex].position);
    highlightMarker(closestIndex);
  });
}

function getMarkerIcon(isActive) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isActive ? 12 : 6,
    fillColor: isActive ? "#ff4081" : "#aaa",
    fillOpacity: 1,
    strokeWeight: 0,
  };
}

function highlightMarker(activeIndex) {
  markers.forEach((marker, i) => {
    marker.setIcon(getMarkerIcon(i === activeIndex));
  });
}

function scrollToCard(index) {
  const card = document.querySelectorAll(".card")[index];
  card.scrollIntoView({ behavior: "smooth", inline: "center" });
}

window.initMap = initMap;
