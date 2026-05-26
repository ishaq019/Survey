const PARTICIPANT_STORAGE_KEY = 'publicSurveyParticipantId';

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

const makeObjectIdLikeValue = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getParticipantId = () => {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('participantId') || params.get('studentId');

  if (isObjectId(fromUrl)) {
    localStorage.setItem(PARTICIPANT_STORAGE_KEY, fromUrl);
    return fromUrl;
  }

  const saved = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
  if (isObjectId(saved)) return saved;

  const generated = makeObjectIdLikeValue();
  localStorage.setItem(PARTICIPANT_STORAGE_KEY, generated);
  return generated;
};
