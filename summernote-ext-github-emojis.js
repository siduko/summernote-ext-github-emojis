(function (factory) {
  /* global define */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(window.jQuery);
  }
}(function ($) {
  // Define language
  $.extend(true, $.summernote.lang, {
    'en-US': {
      emojis: {
        emojis: 'Emojis',
        select: "Select a emojis"
      }
    }
  });

  $.extend($.summernote.plugins, {
    'emojis': function (context) {
      var self = this;
      var ui = $.summernote.ui;

      var $editor = context.layoutInfo.editor;
      var options = context.options;
      var lang = options.langInfo;

      var KEY = {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        ENTER: 13
      };
      var COLUMN_LENGTH = 14;
      var COLUMN_WIDTH = 38;

      var currentColumn, currentRow, totalColumn, totalRow = 0;

      // emojis data set
      var emojis = [];
      var emojiUrls = [];

      context.memo('button.emojis', function () {
        return ui.button({
          contents: '<i class="fa fa-smile-o" aria-hidden="true"></i>',
          tooltip: lang.emojis.emojis,
          click: function () {
            showAndInsertEmojis();
          }
        }).render();
      });

      /**
      * Make Emojis Table
      *
      * @private
      * @return {jQuery}
      */
      function makeEmojisSetTable () {
        var $table = $('<table/>');
        $.each(emojis, function (idx, emoji) {
          var $td = $('<td/>').addClass('note-specialchar-node');
          var $tr = (idx % COLUMN_LENGTH === 0) ? $('<tr/>') : $table.find('tr').last();

          var $button = ui.button({
            callback : function ($node) {
              var content = emojiUrls[emoji];
              // 2017.06.27 Pedro Pelaez - Erased name text because it break table layout
              $node.html('<img src="' + content + '" width="20" style="margin-left:-6px"/>');
              $node.attr('title', ':'+emoji);
              $node.attr('data-value', encodeURIComponent(emojiUrls[emoji]));
              $node.css({
                width: COLUMN_WIDTH,
                height: COLUMN_WIDTH,
                'margin-right' : '3px',
                'margin-bottom' : '3px'
              });
            }
          }).render();

          $td.append($button);

          $tr.append($td);
          if (idx % COLUMN_LENGTH === 0) {
            $table.append($tr);
          }
        });

        totalRow = $table.find('tr').length;
        totalColumn = COLUMN_LENGTH;

        return $table;
      };

      /**
      * Plugin initialize
      */
      this.initialize = function () {
        var $container = options.dialogsInBody ? $(document.body) : $editor;

        var emojisHint = {
          match: /:([\-+\w]+)$/,
          search: function (keyword, callback) {
            callback($.grep(emojis, function (item) {
              return item.indexOf(keyword)  === 0;
            }));
          },
          template: function (item) {
            var content = emojiUrls[item];
            return '<img src="' + content + '" width="20" /> :' + item + ':';
          },
          content: function (item) {
            var url = emojiUrls[item];
            if (url) {
              return $('<img />').attr('src', url).css('width', 20)[0];
            }
            return '';
          }
        };

        if(options.hint){
          if(Array.isArray(options.hint)){
            options.hint.push(emojisHint);
          }else{
            var temp = options.hint;
            options.hint = [];
            options.hint.push(temp);
            options.hint.push(emojisHint);
          }
        }

        $.ajax({
          url: 'https://api.github.com/emojis',
          async: true // 2017.06.27 Pedro Pelaez - Allow asynchronous calls, don't break anything and load better.
        }).done(function(data) {
          emojis = Object.keys(data);
          emojiUrls = data;
          var body = '<div class="form-group row-fluid">' + makeEmojisSetTable()[0].outerHTML + '</div>';
          self.$dialog = ui.dialog({
            title: lang.emojis.select,
            body: body
          }).render().appendTo($container);
        });

      };

      /**
      * Show and insert Emojis to editor
      * @private
      */
      function showAndInsertEmojis() {
        var text = context.invoke('editor.getSelectedText');
        context.invoke('editor.saveRange');
        showEmojisDialog(text).then(function (selectChar) {
          context.invoke('editor.restoreRange');

          // build node
          var $node = $('<img />')
            .attr('src', selectChar)
            .css({
              'width': 20
            })[0];

          if ($node) {
            // insert node
            context.invoke('editor.insertNode', $node);
          }
        }).fail(function () {
          context.invoke('editor.restoreRange');
        });
      };

      /**
      * Show Emojis Dialog
      * @private
      * @param {jQuery} $dialog
      * @return {Promise}
      */
      function showEmojisDialog (text) {
        return $.Deferred(function (deferred) {
          var $emojisDialog = self.$dialog;
          var $emojisCharNode = $emojisDialog.find('.note-specialchar-node');
          var $selectedNode = null;
          var ARROW_KEYS = [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT];
          var ENTER_KEY = KEY.ENTER;

          function addActiveClass($target) {
            if (!$target) {
              return;
            }
            $target.find('button').addClass('active');
            $selectedNode = $target;
          }

          function removeActiveClass($target) {
            $target.find('button').removeClass('active');
            $selectedNode = null;
          }

          // find next node
          function findNextNode(row, column) {
            var findNode = null;
            $.each($emojisCharNode, function (idx, $node) {
              var findRow = Math.ceil((idx + 1) / COLUMN_LENGTH);
              var findColumn = ((idx + 1) % COLUMN_LENGTH === 0) ? COLUMN_LENGTH : (idx + 1) % COLUMN_LENGTH;
              if (findRow === row && findColumn === column) {
                findNode = $node;
                return false;
              }
            });
            return $(findNode);
          }

          function arrowKeyHandler(keyCode) {
            // left, right, up, down key
            var $nextNode;
            var lastRowColumnLength = $emojisCharNode.length % totalColumn;

            if (KEY.LEFT === keyCode) {

              if (currentColumn > 1) {
                currentColumn = currentColumn - 1;
              } else if (currentRow === 1 && currentColumn === 1) {
                currentColumn = lastRowColumnLength;
                currentRow = totalRow;
              } else {
                currentColumn = totalColumn;
                currentRow = currentRow - 1;
              }

            } else if (KEY.RIGHT === keyCode) {

              if (currentRow === totalRow && lastRowColumnLength === currentColumn) {
                currentColumn = 1;
                currentRow = 1;
              } else if (currentColumn < totalColumn) {
                currentColumn = currentColumn + 1;
              } else {
                currentColumn = 1;
                currentRow = currentRow + 1;
              }

            } else if (KEY.UP === keyCode) {
              if (currentRow === 1 && lastRowColumnLength < currentColumn) {
                currentRow = totalRow - 1;
              } else {
                currentRow = currentRow - 1;
              }
            } else if (KEY.DOWN === keyCode) {
              currentRow = currentRow + 1;
            }

            if (currentRow === totalRow && currentColumn > lastRowColumnLength) {
              currentRow = 1;
            } else if (currentRow > totalRow) {
              currentRow = 1;
            } else if (currentRow < 1) {
              currentRow = totalRow;
            }

            $nextNode = findNextNode(currentRow, currentColumn);

            if ($nextNode) {
              removeActiveClass($selectedNode);
              addActiveClass($nextNode);
            }
          }

          function enterKeyHandler() {
            if (!$selectedNode) {
              return;
            }

            deferred.resolve(decodeURIComponent($selectedNode.find('button').data('value')));
            $emojisDialog.modal('hide');
          }

          function keyDownEventHandler(event) {
            event.preventDefault();
            var keyCode = event.keyCode;
            if (keyCode === undefined || keyCode === null) {
              return;
            }
            // check arrowKeys match
            if (ARROW_KEYS.indexOf(keyCode) > -1) {
              if ($selectedNode === null) {
                addActiveClass($emojisCharNode.eq(0));
                currentColumn = 1;
                currentRow = 1;
                return;
              }
              arrowKeyHandler(keyCode);
            } else if (keyCode === ENTER_KEY) {
              enterKeyHandler();
            }
            return false;
          }

          // remove class
          removeActiveClass($emojisCharNode);

          // find selected node
          if (text) {
            for (var i = 0; i < $emojisCharNode.length; i++) {
              var $checkNode = $($emojisCharNode[i]);
              if ($checkNode.text() === text) {
                addActiveClass($checkNode);
                currentRow = Math.ceil((i + 1) / COLUMN_LENGTH);
                currentColumn = (i + 1) % COLUMN_LENGTH;
              }
            }
          }

          ui.onDialogShown(self.$dialog, function () {

            $(document).on('keydown', keyDownEventHandler);

            self.$dialog.find('button').tooltip();

            $emojisCharNode.on('click', function (event) {
              event.preventDefault();
              deferred.resolve(decodeURIComponent($(event.currentTarget).find('button').data('value')));
              ui.hideDialog(self.$dialog);
            });


          });

          ui.onDialogHidden(self.$dialog, function () {
            $emojisCharNode.off('click');

            self.$dialog.find('button').tooltip('destroy');

            $(document).off('keydown', keyDownEventHandler);

            if (deferred.state() === 'pending') {
              deferred.reject();
            }
          });

          ui.showDialog(self.$dialog);
        });
      };
    }
  });
}));
