var util = require ( 'util' );

var main = function ( ) {

  function make_add ( left, right ) {
    return {
    left: left,
    right: right,
    compile: compile_add
      };
    }

  var ast = {
    type: 'block',
    compile: compile_block,
    children: [
      make_assignment ( make_var ( 'n' ), make_number ( 100 ) ),
      make_assignment ( make_var ( 'a' ), make_number ( 1 ) ),
      make_assignment ( make_var ( 'b' ), make_number ( 1 ) ),
      { type: 'while',
        condition: {
            text: '!=',
              left: make_var ( 'n' ),
              right: make_number ( 0 ),
              compile: compile_not_equal
          },
        children: [
          make_assignment ( make_var ( 'temp' ), make_add ( make_var ( 'a' ), make_var ( 'b' ) ) ),
          make_assignment ( make_var ( 'a' ), make_var ( 'b' ) ),
          make_assignment ( make_var ( 'b' ), make_var ( 'temp' ) ),
          make_assignment ( make_var ( 'n' ), make_add ( make_var ( 'n' ), make_number ( -1 ) ) ),
          ],
          compile: compile_while
        },
      {
      compile: function compile_print ( cgen ) {
        cgen.emit ( ops.print );
        }
        },
      {
      compile: function compile_end ( cgen ) {
        cgen.emit ( ops.end );
        }
        }
     ]};

  ast.compile ( cgen );
  console.log ( cgen.code );

  // Calculate fib(102)

  /*
   * n = 100
   * a = 1
   * b = 1
   * while n != 0:
   *  temp = a + b
   *  a = b
   *  b = temp
   *  n = n - 1
   *
   * li 100
   * # [100]
   * li 1
   * # [100, 1]
   * li 1
   * # [100, 1, 1]
   *
   * loop_start:
   * dup 2
   * # [100, 1, 1, 100]
   * li 0
   * # [100, 1, 1, 100, 0]
   * eq
   * # [100, 1, 1, false]
   * not
   * # [100, 1, 1, true]
   * bn1 the_end
   * # [100, 1, 1]
   *
   * dup 1
   * # [100, 1, 1, 1], [99, 1, 2, 1]
   * dup 1
   * # [100, 1, 1, 1, 1], [99, 1, 2, 1, 2]
   * add
   * # [100, 1, 1, 2], [99, 1, 2, 3]
   * dup 1
   * # [100, 1, 1, 2, 1], [99, 1, 2, 3, 2]
   * set 3
   * # [100, 1, 1, 2], [99, 2, 2, 3]
   * set 1
   * # [100, 1, 2], [99, 2, 3]
   *
   * dup 2
   * # [100, 1, 2, 100]
   * li -1
   * # [100, 1, 2, 100, -1]
   * add
   * # [100, 1, 2, 99]
   * set 3
   * # [99, 1, 2]
   *
   * j loop_start
   * the_end
   */

  var code = [
    make_bunch ( ops.li, ops.li, ops.li ),
    100,
    1,
    1,
    make_bunch ( ops.dup, 2, ops.li ),
    0,
    make_bunch ( ops.eq, ops.not, ops.bn1, 7 ),
    make_bunch ( ops.dup, 1, ops.dup, 1 ),
    make_bunch ( ops.add, ops.dup, 1 ),
    make_bunch ( ops.set, 3, ops.set, 1 ),
    make_bunch ( ops.dup, 2, ops.li ),
    -1,
    make_bunch ( ops.add, ops.set, 3 ),
    make_bunch ( ops.j1, -10 ),
    make_bunch ( ops.set, 1, ops.set, 1 ),
    make_bunch ( ops.print, ops.end )
    ];

  var vm = make_vm ( code );
  vm.debug = false;
  vm.run ( );

  vm = make_vm ( cgen.code );
  vm.debug = false;
  vm.run ( );
  };
main ( );
