function redirect() {
  const random = Math.random().toString(36).slice(2, 2+5);
  window.location.assign("/board?id=" + random);
}