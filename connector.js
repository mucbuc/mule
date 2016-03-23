var assert = require( 'assert' )  
  , fs = require( 'fs' )
  , tmp = require( 'tmp' );

function Connector(options) {
  var currentPath; 

  assert(options.hasOwnProperty('stdin'));
  assert(options.hasOwnProperty('stdout'));
  assert(options.hasOwnProperty('stderr'));

  this.isActive = function() {
    return typeof currentPath !== 'undefined';
  };

  this.pipeOut = function() {
    assert( typeof currentPath !== 'undefined' ); 
    return new Promise( (resolve, reject) => {
      openFileIn( currentPath )
      .then( fd => {
        resolve({ stdin: fd, stdout: options.stdout, stderr: options.stderr }); 
      } )
      .catch( reject ); 
    }); 
  };

  this.pipeIn = function() {
    return new Promise( (resolve, reject) => {
      openTempFileOut()
      .then( openFile => {
        if (typeof currentPath === 'undefined') {
          resolve({ stdin: options.stdin, stdout: openFile.descriptor, stderr: options.stderr });
        }
        else {
          openFileIn( currentPath )
          .then( fd => {
            resolve({ stdin: fd, stdout: openFile.descriptor, stderr: options.stderr });
          } )
          .catch( reject );
        }
        currentPath = openFile.path;
      })
      .catch( reject );
    });
  };

  function openFileIn(path) {
    assert(typeof path !== 'undefined');
    return new Promise( (resolve, reject) => {
      fs.open(path, 'r', (err, fd) => {
        if (err) reject( err );
        else resolve(fd);
      });
    });
  }

  function openTempFileOut() {
    return new Promise( (resolve, reject) => {
      tmp.file( ( err, path ) => {
        if (err) reject( err );
        else {
          fs.open(path, 'a+', (err, fd) => {
            if (err) reject( err );
            else resolve( { 'descriptor': fd, 'path': path } );
          });
        }
      });
    });
  }
}

module.exports = Connector;