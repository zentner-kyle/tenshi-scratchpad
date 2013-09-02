var requirejs = require ('./r.js/r.js');

requirejs.config ({
  nodeRequire: require
  });

requirejs (['./xregexp/xregexp-all.js'],
function (xregexp) {

  var lex = function () {
    var token_reg = xregexp ( 
        ' (?<space>       \\p{Whitespace}+)                   |' +
        ' (?<number>      [0-9]+)                             |' +
        ' (?<identifier>  [\\p{Letter}_] [\\p{Letter}_0-9]*)  |' +
        ' (?<operator>    [^\\p{Letter}_0-9\\p{Whitespace}]+)  '
        , 'x' );
    var types = ['space', 'number', 'identifier', 'operator'];
    return function (text) {
      var match = xregexp.exec (text, token_reg);
      for (var t in types) {
        if (match[types[t]] !== undefined) {
          return {type: types[t], text: match[types[t]]};
          }
        }
      }
    } ();

  var lexAll = function (text) {
    var idx = 0;
    var out = [];
    var tok;
    while (idx < text.length) {
      tok = lex(text.substr(idx));
      idx += tok.text.length;
      out.push (tok);
      }
    return out;
    };

  function obj_or(obja, objb) {
    var k;
    for (k in objb) {
      obja[k] = objb[k];
      }
    return obja;
    }

  var atom = {
    lbp: 0,
    nud: function () {
      return this;
      },
    };

  function infix (lbp, rbp) {
    rbp = rbp === undefined ? rbp : lbp;
    return {
      led: function (parser, left) {
        this.left = left;
        this.right = parser.expression (rbp);
        return this;
        },
      lbp: lbp,
      };
    };

  var parser = {
  current: null,
  idx: 0,
  textTable: {
    '+': infix(1),
    },
  typeTable: {
    'number' : atom,
    'identifier': atom,
    },
  advance: function () {
    this.current = this.tokens[this.idx];
    this.idx += 1;
    if (this.current === undefined) {
      this.current = {text: '(end)', lbp: 0};
      }
    if (this.current.text in this.textTable) {
      this.current = obj_or(Object.create(this.textTable[this.current.text]), this.current);
      }
    else if (this.current.type in this.typeTable) {
      this.current = obj_or(Object.create(this.typeTable[this.current.type]), this.current);
      }
    else if (this.current.type === 'space') {
      this.advance ();
      }
    },
  expression: function (rbp) {
    var left;
    var t = this.current;
    this.advance();
    left = t.nud();
    while (rbp < this.current.lbp) {
      t = this.current;
      this.advance();
      left = t.led(this, left);
      }
    return left;
    },
    parse: function (text) {
      this.idx = 0;
      this.tokens = lexAll(text);
      this.advance ()
      return this.expression (0)
      }
    };

  console.log (parser.parse ('a + 1'));
  //var token;
  //var idx = 0;

  //function advance () {
    //token = tokens[idx];
    //idx += 1;
    //if (token === undefined) {
      //token = {text: '(end)', lbp: 0};
      //}
    //if (token.text in symbol_table) {
      //obj_or(token, symbol_table[token.text]);
      //}
    //if (token.type === 'number') {
      //token.nud = function () {
        //return this;
        //}
      //token.lbp = 0;
      //}
    //else if (token.type === 'space') {
      //advance ();
      //}
    //};

  //var expression = function (rbp) {
    //var left;
    //var t = token;
    //advance();
    //left = t.nud();
    //while (rbp < token.lbp) {
      //t = token;
      //advance();
      //left = t.led(left);
      //}
    //return left;
    //}

  //var symbol_table = {
    //'+': {
      //led: function (left) {
        ////console.log('HERE')
        //this.left = left;
        //this.right = expression (1);
        //return this;
        //},
      //lbp: 1,
      //}
    //};

  //var tokens = lexAll ('1 + 1');
  //advance ();

  //var original_symbol = {
    //nud: function () {
      //this.error ("Undefined.");
      //},
    //led: function (left) {
      //this.error ("Missing operator.");
      //}
    //};

  //function obj_or(obja, objb) {
    //var k;
    //for (k in objb) {
      //obja[k] = objb[k];
      //}
    //return obja;
    //}

  //var parser_proto = {
    //get: function (text) {
      //return this.table[text]
      //},
    //parse: function (text) {
      //this.text = text;
      //this.idx = 0;
      //},
    //};

  //function atom (parser, token) {
    //return token;
    //}

  //function make_parser () {
    //return obj_or (Object.create (parser_proto), {
      //typeTable: {
        //space: null,
        //number: atom,
        //identifier: atom,
        //},
      //text: "",
      //idx: 0,
      //rbp: 0,
      //});
    //};


  //function parse (text) {
    //return make_parser ().parse (text);
    //}

  //var parser 
  //var expression = function (rbp) {
    //var left;
    //};


  });
