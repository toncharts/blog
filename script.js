const clientId = "5d6fa75bb8b643dbb86661b4e46b5382";
const clientSecret = "781ca22c68804bfda171dc1caa627435";

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
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: { Authorization: "Bearer " + token }
    }
  );
  return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const artistId = document.body.dataset.artistId;
  if (!artistId) return;

  const artist = await getArtist(artistId);

  document.getElementById("artist-name").innerText = artist.name;
  document.getElementById("artist-image").src = artist.images[0].url;
});
