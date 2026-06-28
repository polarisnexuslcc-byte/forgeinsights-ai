export async function embedText(text) {
  return fakeEmbedding(text);
}

function fakeEmbedding(text) {
  const tokens = String(text || '').slice(0, 2000).split('');
  const size = 128;
  const vector = new Array(size).fill(0);

  for (let i = 0; i < tokens.length; i += 1) {
    vector[i % size] += tokens[i].charCodeAt(0) / 255;
  }

  return vector;
}
