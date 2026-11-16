// Sample titles for the landing page's shelf. They have no cover images: a
// third-party cover (Open Library redirects to archive.org) loads too slowly
// and without the CORS headers a WebGL texture needs, so the books are drawn
// plain, with the title and author, like a library book without a cover.
export const HERO_BOOKS = [
  { author: 'George Orwell', isbn: '9780451524935', title: '1984' },
  {
    author: 'Jane Austen',
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
  },
  {
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    title: 'The Great Gatsby',
  },
  { author: 'J.R.R. Tolkien', isbn: '9780547928227', title: 'The Hobbit' },
  {
    author: 'Harper Lee',
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
  },
  {
    author: 'J. D. Salinger',
    isbn: '9780316769488',
    title: 'The Catcher in the Rye',
  },
  {
    author: 'Margaret Atwood',
    isbn: '9780385490818',
    title: "The Handmaid's Tale",
  },
  { author: 'Paulo Coelho', isbn: '9780061122415', title: 'The Alchemist' },
  {
    author: 'Fyodor Dostoevsky',
    isbn: '9780140449136',
    title: 'Crime and Punishment',
  },
  { author: 'Leo Tolstoy', isbn: '9780199232765', title: 'War and Peace' },
  { author: 'Frank Herbert', isbn: '9780441172719', title: 'Dune' },
  { author: 'Toni Morrison', isbn: '9781400033416', title: 'Beloved' },
  { author: 'Dan Brown', isbn: '9780307277671', title: 'The Da Vinci Code' },
  {
    author: 'John Steinbeck',
    isbn: '9780143039433',
    title: 'The Grapes of Wrath',
  },
  { author: 'Aldous Huxley', isbn: '9780060850524', title: 'Brave New World' },
  { author: 'James Joyce', isbn: '9780141182803', title: 'Ulysses' },
  {
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    title: 'A Brief History of Time',
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
  { author: 'Leo Tolstoy', isbn: '9780143035008', title: 'Anna Karenina' },
] as const;
