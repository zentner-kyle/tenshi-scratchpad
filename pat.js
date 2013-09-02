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

  var ast = {
      rules: [],
      push: function (arg) {
        arg.parent = this;
        this.ast.push(arg);
        },
      pop: function () {
        return this.ast.pop()
        },
      rbp: 0,
      lbp: 0,
      toAst: function () {
        var out;
        var c;
        if (this.ast !== undefined) {
          out = [this.text];
          for (c in this.ast) {
            out.push (this.ast[c].toAst ());
            }
          return out;
          }
        else {
          return this.text;
          }
        }
      };

  var state = {
    textTable: {},
    typeTable: {},
    method: function (name, func) {
      this[name] = func;
      },
    clone: function (token) {
      var toClone = this.textTable[token.text];
      if (toClone === undefined) {
        toClone = this.typeTable[token.type];
        if (toClone === null) {
          return null;
          }
        if (toClone === undefined) {
          console.log(token);
          throw new Error('Could not create ast for token ' + token.text);
          }
        return obj_or (Object.create(toClone), {
          text: token.text,
          type: token.type,
          });
        }
      else {
        return obj_or (Object.create(toClone), {
          ast: []
          });
        }
      },
    };

  var atom = obj_or (Object.create (ast), {
    rules: [['push', 'infix']],
    });

  var expr_state = obj_or (Object.create (state), {
    typeTable: {
      'number': atom,
      'identifier': atom,
      'space': null,
      },
    });

  function infix (name, lbp, rbp, starts_indent) {
    if (rbp === undefined) {
      rbp = lbp;
      }
    if (starts_indent === undefined) {
      starts_indent = false;
      }
    return obj_or (Object.create (ast), {
        text: name,
        rules: [['left'], ['right'], ['stateChange', 'prefix']],
        rbp: rbp,
        lbp: lbp,
      });
    };

  function prefix (name, rbp) {
    return obj_or (Object.create (ast), {
        text: name,
        rules: [['right'], ['push', 'prefix']],
        rbp: rbp,
      });
    };

  var infix_state = obj_or (Object.create (expr_state), {
    textTable: {
      '+': infix('+', 60, 60),
      },
    });

  var statement_state = obj_or (Object.create (state), {
    typeTable: {
      'identifier': obj_or (Object.create (ast), {
        rules: [['push', 'assignment']],
        }),
      'space': null,
      },
    });

  var assignment = obj_or (Object.create (state), {
    typeTable: {
      space: null,
      },
    textTable: {
      '=': infix('=', 5, 4),
      },
    });

  var prefix_state = obj_or (Object.create (expr_state), {
    textTable: {
      '+': prefix('+', 60),
      '-': prefix('-', 60),
      '*': prefix('*', 70),
      '&': prefix('*', 40),
      }
    });

  var parser = {
    states: {
      infix: infix_state,
      prefix: prefix_state,
      statement: statement_state,
      assignment: assignment,
      },
    accum: null,
    current: null,
    root: obj_or(Object.create(ast), {
      text: '(root)',
      ast: [],
      rbp: 0,
      }),
    state_name: null,
    state: function (name, val) {
      if (val !== undefined) {
        if (this.states[name] !== undefined) {
          throw new Error('State ' + name + ' already defined.');
          }
        this.states[name] = val;
        }
      name = name || this.state_name;
      var s = this.states[name];
      if (s === undefined) {
        this.states[name] = state();
        s = this.states[name];
        }
      return s;
      },
    method: function (name, func) {
      this[name] = func;
      },
    left: function () {
      console.log('Current: ' + this.current.text)
      while (this.accum.rbp >= this.current.lbp) {
        //console.log('accum: ' + this.accum.text)
        //console.log('accum: ' + this.accum.text)
        this.accum = this.accum.parent;
        }
      this.current.push (this.accum.pop ());
      this.accum.push(this.current);
      },
    right: function () {
      this.accum = this.current;
      },
    push: function (next_state) {
      this.accum.push (this.current);
      this.state_name = next_state;
      },
    process: function (tok) {
      var clone = this.state().clone(tok);
      var rule;
      if (clone === null) {
        return;
        }
      this.current = clone;
      for (var r in clone.rules) {
        rule = clone.rules[r];
        //console.log('Rule: ' + rule);
        this[rule[0]].apply(this, rule.slice(1));
        }
      },
    run: function (state, tokens) {
      this.accum = this.root;
      this.state_name = state;
      for (var t in tokens) {
        this.process (tokens[t]);
        }
      this.out = this.root.toAst ().slice(1);
      },
    stateChange: function (next_state) {
      this.state_name = next_state;
      }
    };
  //parser.run('infix', lexAll('x + 1 + 1 + 2'))
  //console.log(JSON.stringify(parser.out));
  parser.run('statement', lexAll('a = x + 1 + -1 + 2'))
  console.log(JSON.stringify(parser.out));
  });
