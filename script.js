const clientId = "SEU_CLIENT_ID";
const clientSecret = "SEU_CLIENT_SECRET";

/* MENU */
document.addEventListener("DOMContentLoaded", () => {
  fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu").innerHTML = html;
    });
});

/* SPOTIFY */
async function getToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
    },
    body: "grant_type=client_credentials"
  });
  return (await res.json()).access_token;
}

async function getArtist(artistId) {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const artistId = document.body.dataset.artistId;
  if (!artistId) return;

  const artist = await getArtist(artistId);
  document.getElementById("artist-name").textContent = artist.name;
  document.getElementById("artist-image").src = artist.images[0].url;
});
