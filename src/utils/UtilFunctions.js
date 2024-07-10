const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be|youtube\.com\/shorts)\/.+$/;
  return regex.test(url);
};

const extractYouTubeVideoId = (url) => {
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('.be/')[1].split('&')[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('/shorts/')[1].split('?')[0];
  }
  return videoId;
};
export { formatDate, isValidYouTubeUrl, extractYouTubeVideoId }