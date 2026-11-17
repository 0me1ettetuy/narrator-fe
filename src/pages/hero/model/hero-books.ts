// Sample titles for the landing page's shelf, with their covers (small JPEGs in
// `public/hero-covers`, named by ISBN, served from our own origin so WebGL may
// read them).
export const HERO_BOOKS = [
  { author: 'George Orwell', isbn: '9780451524935', title: '1984' },
  { author: 'Mary Shelley', isbn: '9780141439471', title: 'Frankenstein' },
  {
    author: 'Jane Austen',
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
  },
  { author: 'Bram Stoker', isbn: '9780141439846', title: 'Dracula' },
  { author: 'J.R.R. Tolkien', isbn: '9780547928227', title: 'The Hobbit' },
  { author: 'Herman Melville', isbn: '9780142437247', title: 'Moby-Dick' },
  {
    author: 'Harper Lee',
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
  },
  { author: 'Charlotte Brontë', isbn: '9780141441146', title: 'Jane Eyre' },
  {
    author: 'Margaret Atwood',
    isbn: '9780385490818',
    title: "The Handmaid's Tale",
  },
  { author: 'Emily Brontë', isbn: '9780141439556', title: 'Wuthering Heights' },
  {
    author: 'Fyodor Dostoevsky',
    isbn: '9780140449136',
    title: 'Crime and Punishment',
  },
  {
    author: 'Oscar Wilde',
    isbn: '9780141439570',
    title: 'The Picture of Dorian Gray',
  },
  { author: 'Leo Tolstoy', isbn: '9780199232765', title: 'War and Peace' },
  {
    author: 'Charles Dickens',
    isbn: '9780141439563',
    title: 'Great Expectations',
  },
  { author: 'Frank Herbert', isbn: '9780441172719', title: 'Dune' },
  { author: 'Homer', isbn: '9780140268867', title: 'The Odyssey' },
  { author: 'Dan Brown', isbn: '9780307277671', title: 'The Da Vinci Code' },
  {
    author: 'William Golding',
    isbn: '9780399501487',
    title: 'Lord of the Flies',
  },
  {
    author: 'John Steinbeck',
    isbn: '9780143039433',
    title: 'The Grapes of Wrath',
  },
  { author: 'George Orwell', isbn: '9780451526342', title: 'Animal Farm' },
  { author: 'Aldous Huxley', isbn: '9780060850524', title: 'Brave New World' },
  {
    author: 'Fyodor Dostoevsky',
    isbn: '9780374528379',
    title: 'The Brothers Karamazov',
  },
  {
    author: 'Jane Austen',
    isbn: '9780679783268',
    title: 'Sense and Sensibility',
  },
  { author: 'Gustave Flaubert', isbn: '9780140449129', title: 'Madame Bovary' },
  {
    author: 'Mikhail Bulgakov',
    isbn: '9780141180144',
    title: 'The Master and Margarita',
  },
  {
    author: 'Joseph Conrad',
    isbn: '9780141441672',
    title: 'Heart of Darkness',
  },
  { author: 'Leo Tolstoy', isbn: '9780143035008', title: 'Anna Karenina' },
] as const;

export function getHeroCoverUrl(isbn: string) {
  return `/hero-covers/${isbn}.jpg`;
}
