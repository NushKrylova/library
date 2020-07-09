var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let testId;

  test('#example Test GET /api/books', function (done) {
    chai.request(server)
      .get('/api/books')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });

  suite('Routing tests', function () {

    suite('POST /api/books with title => create book object/expect book object', function () {

      test('Test POST /api/books with title', function (done) {
        let bookTitle = 'My test book' + new Date();
        chai.request(server)
          .post('/api/books')
          .send({ title: bookTitle })
          .end(function (err, res) {
            testId = res.body._id; // store _id for later tests and deletion
            assert.equal(res.status, 200);
            assert.property(res.body, 'title', 'Book should contain a title');
            assert.property(res.body, '_id', 'Book should contain an _id');
            assert.strictEqual(res.body.title, bookTitle);
            done();
          });
      });

      test('Test POST /api/books with no title given', function (done) {
        chai.request(server)
          .post('/api/books')
          .end((err, res) => {
            assert.strictEqual(res.text, 'missing title');
            done();
          });
      });

      test('Existing title in request body', function (done) {
        chai.request(server)
          .post('/api/books')
          .send({ title: 'My test book' })
          .end((err, res) => {
            assert.strictEqual(res.text, 'title already exists');
            done();
          });
      });

    });


    suite('GET /api/books => array of books', function () {

      test('Test GET /api/books', function (done) {
        chai.request(server)
          .get('/api/books')
          .end((err, res) => {
            const booksArr = res.body;
            const firstBook = booksArr[0];

            assert.isArray(booksArr, 'Response should be an array');
            assert.property(firstBook, 'commentcount', 'Books in array should contain commentcount');
            assert.isNumber(firstBook.commentcount, 'commentcount should be a number');
            assert.property(firstBook, 'title', 'Books in array should contain a title');
            assert.property(firstBook, '_id', 'Books in array should contain an _id');
            done();
          });
      });

    });


    suite('GET /api/books/[id] => book object with [id]', function () {

      test('Test GET /api/books/[id] with id not in db', function (done) {
        chai.request(server)
          .get('/api/books/5f032c251d7a3f230715994d')
          .end((err, res) => {
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

      test('Test GET /api/books/[id] with valid id in db', function (done) {
        chai.request(server)
          .get(`/api/books/${testId}`)
          .end((err, res) => {
            const bookObj = res.body;

            assert.property(bookObj, 'comments', 'Book should contain comments');
            assert.isArray(bookObj.comments, 'Comments should be an array');
            assert.property(bookObj, 'title', 'Book should contain a title');
            assert.property(bookObj, '_id', 'Book should contain an _id');
            assert.equal(bookObj._id, testId);
            done();
          });
      });

    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function () {

      test('Test POST /api/books/[id] with comment', function (done) {
        chai.request(server)
          .post(`/api/books/${testId}`)
          .send({ comment: 'test comment' })
          .end((err, res) => {
            const bookObj = res.body;

            assert.property(bookObj, 'comments', 'Book should contain comments');
            assert.isArray(bookObj.comments, 'Comments should be an array');
            assert.strictEqual(bookObj.comments[0], 'test comment', 'Comments should include test comment submitted');
            assert.property(bookObj, 'title', 'Book should contain title');
            assert.property(bookObj, '_id', 'Book should contain _id');
            done();
          });
      });

    });

  });

});
