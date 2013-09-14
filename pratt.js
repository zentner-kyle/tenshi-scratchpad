var requirejs = require ('./r.js/r.js');
var util = require('util');

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
      if (!match) {
        return null;
        }
      for (var t in types) {
        if (match[types[t]] !== undefined) {
          return {type: types[t], text: match[types[t]]};
          }
        }
      }
    } ();

  function string_map (obj) {
    obj = obj || {};
    return {
      get: function (key) {
        return obj[key + '$'];
        },
      set: function (key, val) {
        obj[key + '$'] = val;
        },
      has: function (key) {
        return key + '$' in obj;
        },
      'delete': function (key) {
        return delete obj[key + '$'];
        }
      };
    };

  function scope (previousScope) {
    textTable = string_map ();
    typeTable = string_map ();
    return {
      getText: function (key) {
        return textTable.get(key);
        },
      getType: function (key) {
        return typeTable.get(key);
        },
      setText: function (key, val) {
        textTable.set(key, val);
        return this;
        },
      setType: function (key, val) {
        typeTable.set(key, val);
        return this;
        },
      loadText: function (table) {
        var key;
        for (key in table) {
          this.setText(key, table[key]);
          }
        },
      loadType: function (table) {
        var key;
        for (key in table) {
          this.setType(key, table[key]);
          }
        },
      };
    };

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

  function tableStackGet (stack, key) {
    var i = stack.length - 1;
    var res;
    while (i >= 0) {
      res = stack[i][key];
      if (res !== undefined) {
        return res;
        }
      else {
        i -= 1;
        }
      }
    return undefined;
    };

  function tableStackSetNew (stack, key, val) {
    stack[stack.length - 1][key] = val;
    };

  function tableStackChange (stack, key, val) {
    var i = stack.length - 1;
    var res;
    while (i >= 0) {
      if (key in stack[i]) {
        stack[i][key] = val;
        return;
        }
      }
    throw new Error('Could not change key ' + key + ' to ' + val + ' in ' + stack + '.');
    };

  var atom = {
    lbp: 0,
    nud: function (parser) {
      return this;
      },
    };

  function infix (lbp, rbp) {
    rbp = rbp !== undefined ? rbp : lbp;
    console.log(rbp)
    return {
      led: function (parser, left) {
        this.left = left;
        this.right = parser.expression (rbp);
        return this;
        },
      lbp: lbp,
      };
    };

  function prefix (rbp) {
    return {
      nud: function (parser) {
        this.right = parser.expression (rbp);
        return this;
        },
      };
    };
  var keyword = { type: 'keyword' };

  var parser = {
    textTables: [
      ],
    exprTextTable: {
      '+': infix(60),
      '-': obj_or(infix(60), prefix(80)),
      '++': prefix(90),
      'if': keyword,
      'while': keyword,
      },
    typeTables: [
      ],
    exprTypeTable: {
      'number' : atom,
      'identifier': atom,
      'space': null,
      },
    textTablePush: function (table) {
      this.textTables.push (table);
      },
    typeTablePush: function (table) {
      this.typeTables.push (table);
      },
    textTableGet: function (key) {
      return tableStackGet(this.textTables, key);
      },
    typeTableGet: function (key) {
      return tableStackGet(this.typeTables, key);
      },
    textTableSetNew: function (key, val) {
      tableStackSetNew (this.textTables, key, val);
      },
    typeTableSetNew: function (key, val) {
      tableStackSetNew (this.typeTables, key, val);
      },
    splitOp: function (token) {
      var i = token.text.length;
      while (this.textTableGet(token.text.substr(0, i)) === undefined) {
          i -= 1;
          }
      if (i === 0) {
          throw 'Could not identify operator ' + token.text;
          }
      if (i === token.text.length) {
          return [token];
          }
      else {
          return [obj_or(token, {text: token.text.substr(0, i)})].concat(
                  this.splitOp(obj_or(token, {text: token.text.substr(i)})));
          }
      },
    moreTokens: function (count) {
      while (count > 0) {
        var token = lex(this.text.substr(this.text_idx));
        if (token) {
          this.text_idx += token.text.length;
          if (token.type === 'operator') {
            this.tokens.concat (this.splitOp(token));
            }
          else {
            this.tokens.push (token);
            }
          }
        count -= 1;
        }
      },
    nextToken: function () {
      if (this.tokens.length === this.idx) {
        this.moreTokens(1)
        }
      this.current = this.tokens[this.idx];
      this.idx += 1;
      },
    peekToken: function (idx) {
      var count;
      idx = idx || 0;
      count = 1 + idx + this.idx - this.tokens.length;
      if (count > 0) {
        this.moreTokens(count);
        }
      return this.tokens[this.idx + idx];
      },
    loadCurrentFromTable: function () {
      var toClone;
      if (!this.current) {
        this.current = {text: '(end)', type: '(special)', lbp: 0};
        return;
        }
      toClone = this.textTableGet(this.current.text);
      if (toClone !== undefined) {
        this.current = obj_or(Object.create(toClone), this.current);
        }
      else {
        toClone = this.typeTableGet(this.current.type);
        if (toClone === null) {
          this.advance ();
          }
        else if (toClone === undefined){
          throw new Error('Unknown token!');
          }
        else {
          this.current = obj_or(Object.create(toClone), this.current);
          }
        }
      },
    advance: function () {
      this.nextToken ();
      this.loadCurrentFromTable ();
      },
    expression: function (rbp) {
      var left;
      var t = this.current;
      this.advance();
      left = t.nud(this);
      while (rbp < this.current.lbp) {
        t = this.current;
        this.advance();
        left = t.led(this, left);
        }
      return left;
      },
    parse_expr: function (text) {
      this.typeTablePush(this.exprTypeTable);
      this.textTablePush(this.exprTextTable);
      this.idx = 0;
      this.tokens = lexAll(text);
      this.advance ()
      return this.expression (0)
      }
  };

  function make_parser (text) {
    return obj_or (Object.create (parser), {
      idx: 0,
      tokens: [],
      current: null,
      text_idx: 0,
      text: text || "",
      text_exhausted: true,
      });
    };

  function parse_expr (text) {
    return make_parser ().parse_expr (text)
    }

  console.log (util.inspect(parse_expr ('++apple + 1 - - bad'), { colors: true, depth: 100 }));
  });
