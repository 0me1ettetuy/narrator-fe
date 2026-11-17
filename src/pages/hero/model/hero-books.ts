// Sample titles for the landing page's shelf, with their covers (small JPEGs in
// `public/hero-covers`, named by ISBN, served from our own origin so WebGL may
// read them).
export const HERO_BOOKS = [
  { author: 'George Orwell', isbn: '9780451524935', title: '1984' },
  { author: 'Victor Hugo', isbn: '9780140444308', title: 'Les Misérables' },
  { author: 'Mary Shelley', isbn: '9780141439471', title: 'Frankenstein' },
  {
    author: 'Robert Louis Stevenson',
    isbn: '9780141439730',
    title: 'Strange Case of Dr Jekyll and Mr Hyde',
  },
  { author: 'Bram Stoker', isbn: '9780141439846', title: 'Dracula' },
  {
    author: 'Jonathan Swift',
    isbn: '9780141439495',
    title: "Gulliver's Travels",
  },
  { author: 'J.R.R. Tolkien', isbn: '9780547928227', title: 'The Hobbit' },
  { author: 'Jane Austen', isbn: '9780141439686', title: 'Persuasion' },
  {
    author: 'Harper Lee',
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
  },
  { author: 'George Eliot', isbn: '9780141439549', title: 'Middlemarch' },
  { author: 'Charlotte Brontë', isbn: '9780141441146', title: 'Jane Eyre' },
  { author: 'Charles Dickens', isbn: '9780141439747', title: 'Oliver Twist' },
  {
    author: 'Margaret Atwood',
    isbn: '9780385490818',
    title: "The Handmaid's Tale",
  },
  {
    author: 'Alexander Pushkin',
    isbn: '9780140448030',
    title: 'Eugene Onegin',
  },
  {
    author: 'Oscar Wilde',
    isbn: '9780141439570',
    title: 'The Picture of Dorian Gray',
  },
  { author: 'Charles Dickens', isbn: '9780141439723', title: 'Bleak House' },
  { author: 'Leo Tolstoy', isbn: '9780199232765', title: 'War and Peace' },
  {
    author: 'Miguel de Cervantes',
    isbn: '9780142437230',
    title: 'Don Quixote',
  },
  { author: 'Frank Herbert', isbn: '9780441172719', title: 'Dune' },
  { author: 'Jane Austen', isbn: '9780141439792', title: 'Northanger Abbey' },
  { author: 'Homer', isbn: '9780140268867', title: 'The Odyssey' },
  {
    author: 'Charles Dickens',
    isbn: '9780141439600',
    title: 'A Tale of Two Cities',
  },
  { author: 'Dan Brown', isbn: '9780307277671', title: 'The Da Vinci Code' },
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
