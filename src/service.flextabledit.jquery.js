/****************************************************************************************************** 
 * A jquery plugin implementing an editable table.
 * 
 * version 1.0.0
 * 
 * Usage:
 *  - Instantiation (basic):
 *      var data = [
 *        ["", "Ford", "Volvo", "Toyota", "Honda"],
 *        ["2014", 10, 11, 12, 13],
 *        ["2015", 20, 11, 14, 13],
 *        ["2016", 30, 15, 12, 13]
 *      ];
 *      $('#table').flextabledit({
 *        content: data
 *      });
 *       ...
 *
 *  - Instantiation (additional options):
 *      var data = [
 *        ["", "Ford", "Volvo", "Toyota", "Honda"],
 *        ["2014", 10, 11, 12, 13],
 *        ["2015", 20, 11, 14, 13],
 *        ["2016", 30, 15, 12, 13]
 *      ];
 *      $('#table').flextabledit({
 *        content: data,
 *        addTableClass: "tableBordered tableStriped",  // Additional classes added to the html table (for styling)
 *        texts: { cut: 'Knippen', copy: 'Kopiëren', paste: 'Plakken', insert: 'Invoegen' } // Multi-language support
 *      });
 *       ...
 *
 *  - Retrieve table cell data
 *      var data = $('#table').table('getData');
 *       ...
 *
 * Version history:
 *   1.0.0 - Initial version
 *
 * @requires jQuery 1.8.0 or later
 *
 * Copyright (c) Jos Huybrighs
 * code.cwwonline.be
 *
 * Licensed under the MIT license.
 * http://en.wikipedia.org/wiki/MIT_License
 *
 ******************************************************************************************************/

; (function ($, win, document, undefined) {

    var version = '1.0.0';
    var pluginName = 'flextabledit';
    var texts = {
        cut: "Cut",
        copy: "Copy",
        paste: "Paste",
        insert: "Insert",
        erase: "Erase",
        remove: "Remove",
        columnName: "Column name"
    };

    function Plugin(element, options) {
        // Get the main element
        this.$element = $(element);
        // Initialize plugin
        this._init(options);
        // Create and show table
        this._renderTable();
    };

    Plugin.prototype = {

        // Select column
        _getAbsPosition: function ($parentEl, width, height) {
            var viewPortWidth = $(window).width();
            var offsetParent = $parentEl.offset();
            var offsetTable = this.$element.offset();
            var tableWidth = this.$table.outerWidth();
            var leftPos = offsetParent.left - offsetTable.left - 1;
            if (leftPos + width > tableWidth) {
                leftPos = tableWidth - width;
                if (leftPos < 0) {
                    leftPos = 0;
                }
            }
            var topPos = offsetParent.top - offsetTable.top + 26;
            var pos = { left: leftPos, right: 0, top: topPos };
            return pos;
        },

        // Unselect column, row, cell
        _unselect: function () {
            // Unselect a previously selected cell, column, row, popup menu
            this.$element.find('th').removeClass('flxtblColSelected');
            var $rows = this.$element.find('tbody tr');
            for (var r = 0; r < $rows.length; r++) {
                $($rows[r]).find('td').removeClass('flxtblColSelected flxtblRowSelected cellSelected');
            }
            if (this.$menuPopup) {
                this.$menuPopup.remove();
                this.$menuPopup = null;
            }
        },

        // Clear the clipboard
        _clearClipBoard: function () {
            // Unselect a marked cell, column, row
            this.$element.find('th').removeClass('flxtblColMarked');
            var $rows = this.$element.find('tbody tr');
            for (var r = 0; r < $rows.length; r++) {
                $($rows[r]).find('td').removeClass('flxtblColMarked flxtblRowMarked cellMarked');
            }
            // Clear clipboard
            this.clipBoard = null;
        },

        // Remove menu popup button
        _removeMenuPopupBtn: function () {
            if (this.$menuPopupBtn) {
                // Remove popup menu button
                this.$menuPopupBtn.remove();
                this.$menuPopupBtn = null;
            }
        },

        // Unselect all
        _unselectAll: function () {
            // Unselect a previously selected cell, column, row, popup menu, and popup menu button
            this._unselect();
            if (this.$menuPopupBtn) {
                // Remove cell popup menu button
                this.$menuPopupBtn.remove();
                this.$menuPopupBtn = null;
            }
        },

        // Select column
        _selectCol: function (colIndex, mark) {
            // Unselect a previously selected cell, column, row, popup menu
            this._unselect();
            // Select the given column
            var $headers = this.$element.find('th');
            var $rows = this.$element.find('tbody tr');
            var $th = $($headers[colIndex]);
            $th.addClass('flxtblColSelected');
            if (mark) {
                $th.addClass('flxtblColMarked');
            }
            for (var r = 0; r < $rows.length; r++) {
                var $cells = $($rows[r]).find('td');
                var $td = $($cells[colIndex]);
                $td.addClass('flxtblColSelected');
                if (mark) {
                    $td.addClass('flxtblColMarked');
                }
            }
        },

        // Select row
        _selectRow: function (rowIndex, mark) {
            // Unselect a previously selected cell, column, row, popup menu
            this._unselect();
            // Select the given row
            var $rows = this.$element.find('tbody tr');
            var $tds = $($rows[rowIndex - 1]).find('td');
            $tds.addClass('flxtblRowSelected');
            if (mark) {
                $tds.addClass('flxtblRowMarked');
            }
        },

        // Select cell
        _selectCell: function (rowIndex, colIndex, mark) {
            // Unselect a previously selected cell, column, row, popup menu
            this._unselect();
            // Select the given cell
            var $rows = this.$element.find('tbody tr');
            var $td = $($rows[rowIndex - 1]).find('td').eq(colIndex);
            $td.addClass('cellSelected');
            if (mark) {
                $td.addClass('cellMarked');
            }
        },

        // Handle Cut
        _onCutAction: function (cellEl, rowIndex, colIndex) {
            this._onCopyAction(cellEl, rowIndex, colIndex);
            this.clipBoard.cutPending = true;
        },

        // Handle Copy
        _onCopyAction: function (cellEl, rowIndex, colIndex) {
            this._clearClipBoard();
            this.clipBoard = { cutPending: false, cellEl: cellEl, rowIndex: rowIndex, colIndex: colIndex };
            if (rowIndex == 0) {
                // Copy column
                this.clipBoard.dataType = 0;
                var $input = $(cellEl)
                this.clipBoard.data = [$input.val()];
                var $bodyRows = this.$element.find('tbody tr');
                for (var r = 0; r < $bodyRows.length; r++) {
                    $input = $($bodyRows[r]).find('td input').eq(colIndex - 1);
                    this.clipBoard.data.push($input.val());
                }
            }
            else if (colIndex == 0) {
                // Copy row
                this.clipBoard.dataType = 1;
                this.clipBoard.data = [];
                var $bodyRows = this.$element.find('tbody tr');
                var $inputs = $($bodyRows[rowIndex - 1]).find('td input');
                for (var i = 0; i < $inputs.length; i++) {
                    var $input = $($inputs[i]);
                    this.clipBoard.data.push($input.val());
                }
            }
            else {
                // Copy cell
                this.clipBoard.dataType = 2;
                this.clipBoard.data = $(cellEl).val();
            }
            this._onCellClicked(cellEl, rowIndex, colIndex, true);
        },

        // Handle Paste
        _onPasteAction: function (cellEl, rowIndex, colIndex) {
            if (this.clipBoard) {
                if (rowIndex == 0 &&
                    this.clipBoard.dataType == 0) {
                    // Paste column
                    var $input = $(cellEl)
                    $input.val(this.clipBoard.data[0]);
                    var $bodyRows = this.$element.find('tbody tr');
                    for (var r = 0; r < $bodyRows.length; r++) {
                        $input = $($bodyRows[r]).find('td input').eq(colIndex - 1);
                        $input.val(this.clipBoard.data[r + 1]);
                    }
                    if (this.clipBoard.cutPending) {
                        $input = $(this.clipBoard.cellEl);
                        $input.val("");
                        for (var r = 0; r < $bodyRows.length; r++) {
                            $input = $($bodyRows[r]).find('td input').eq(this.clipBoard.colIndex - 1);
                            $input.val("");
                        }
                        this._clearClipBoard();
                    }
                }
                else if (colIndex == 0 &&
                         this.clipBoard.dataType == 1) {
                    // Paste row
                    var $bodyRows = this.$element.find('tbody tr');
                    var $inputs = $($bodyRows[rowIndex - 1]).find('td input');
                    for (var i = 0; i < $inputs.length; i++) {
                        var $input = $($inputs[i]);
                        $input.val(this.clipBoard.data[i]);
                    }
                    if (this.clipBoard.cutPending) {
                        $inputs = $($bodyRows[this.clipBoard.rowIndex - 1]).find('td input');
                        for (var i = 0; i < $inputs.length; i++) {
                            var $input = $($inputs[i]);
                            $input.val("");
                        }
                        this._clearClipBoard();
                    }
                }
                else if (this.clipBoard.dataType == 2) {
                    // Paste cell
                    $(cellEl).val(this.clipBoard.data);
                    if (this.clipBoard.cutPending) {
                        $(this.clipBoard.cellEl).val("");
                        this._clearClipBoard();
                    }
                }
            }
            this._onCellClicked(cellEl, rowIndex, colIndex);
        },

        // Handle Insert Col
        _onInsertColAction: function (cellEl, colIndex) {
            var self = this;
            var cellHtml = '<td><input type="text" value="" placeholder="..." /></td>';
            var $bodyRows = this.$element.find('tbody tr');
            // Insert column before the one defined by colIndex
            var $headRow = this.$element.find('thead tr');
            var $newCell = $('<th><input type="text" value="" placeholder="' + this.settings.texts.columnName + '" /></th>');
            $headRow.find('th').eq(colIndex).before($newCell);
            $newCell.find('input').on('click.table input.table', function (ev) {
                self._onInputEvent(this, ev);
            });
            for (var r = 0; r < $bodyRows.length; r++) {
                $newCell = $(cellHtml);
                $($bodyRows[r]).find('td').eq(colIndex).before($newCell);
                $newCell.find('input').on('click.table input.table', function (ev) {
                    self._onInputEvent(this, ev);
                });
            }
            this.nrofDataCols++;
            colIndex++;
            this._onCellClicked(cellEl, 0, colIndex);
        },

        // Handle Delete Col
        _onDeleteColAction: function (colIndex) {
            if (this.nrofDataCols > 1) {
                this.$element.find('thead tr th').eq(colIndex).remove();
                var $bodyRows = this.$element.find('tbody tr');
                for (var r = 0; r < $bodyRows.length; r++) {
                    $($bodyRows[r]).find('td').eq(colIndex).remove();
                }
                this.nrofDataCols--;
            }
            if (colIndex > this.nrofDataCols) {
                colIndex--;
            }
            var $headInputs = this.$element.find('thead input');
            var cellEl = $headInputs[colIndex - 1];
            this._onCellClicked(cellEl, 0, colIndex);
        },

        // Handle Insert Row
        _onInsertRowAction: function (cellEl, rowIndex) {
            var self = this;
            var cellHtml = '<td><input type="text" value="" placeholder="..." /></td>';
            var $bodyRows = this.$element.find('tbody tr');
            // Insert row before the one defined by rowIndex
            var html = '<tr><td><span>';
            html += rowIndex;
            html += '</span></td>';
            for (var c = 0; c < this.nrofDataCols; c++) {
                html += cellHtml;
            }
            html += '</tr>';
            var $row = $(html);
            $($bodyRows[rowIndex - 1]).before($row);
            // Modify subsequent row numbers
            for (var r = rowIndex - 1; r < $bodyRows.length; r++) {
                var $span = $($bodyRows[r]).find('td:first span');
                $span.text(r + 2);
            }
            // Bind event handlers
            $row.find('input').on('click.table input.table', function (ev) {
                self._onInputEvent(this, ev);
            });
            $row.find('td:first').on('click.table', function (ev) {
                self._onRowEvent(this, ev);
            });
            this.nrofDataRows++;
            rowIndex++;
            this._onCellClicked(cellEl, rowIndex, 0);
        },

        // Handle Delete Row
        _onDeleteRowAction: function (rowIndex) {
            var $bodyRows = this.$element.find('tbody tr');
            if ($bodyRows.length > 1) {
                $($bodyRows[rowIndex - 1]).remove();
                // Modify subsequent row numbers
                for (var r = rowIndex; r < $bodyRows.length; r++) {
                    var $span = $($bodyRows[r]).find('td:first span');
                    $span.text(r);
                }
                this.nrofDataRows--;
            }
            var i = rowIndex;
            if (i == $bodyRows.length) {
                i--;
                if (i != 0) {
                    i--;
                    rowIndex--;
                }
            }
            var $cellEl = $($bodyRows[i]).find('td:first');
            this._onCellClicked($cellEl[0], rowIndex, 0);
        },

        // Handle click/touch on menu popup bttn
        _onMenuPopupBtnClicked: function (cellEl, row, col) {
            // Render an appropriate menu bar
            var html = '<div class="dialogPopUp menuPopup"><div class="cutMenuAction">';
            html += this.settings.texts.cut;
            html += '</div><div class="copyMenuAction">';
            html += this.settings.texts.copy;
            var pasteAllowed = false;
            if (this.clipBoard &&
                ((row == 0 && this.clipBoard.dataType == 0) ||
                 (col == 0 && this.clipBoard.dataType == 1) ||
                 (row != 0 && col != 0 && this.clipBoard.dataType == 2))) {
                html += '</div><div class="pasteMenuAction">';
                html += this.settings.texts.paste;
                pasteAllowed = true;
            }
            else {
                html += '</div><div class="pasteDisabledMenuAction">';
                html += this.settings.texts.paste;
            }
            if (row == 0) {
                html += '</div><div class="insertColMenuAction ">';
                html += this.settings.texts.insert;
                if (this.nrofDataCols > 1) {
                    html += '</div><div class="deleteColMenuAction">';
                }
                else {
                    html += '</div><div class="deleteColDisabledMenuAction">';
                }
                html += this.settings.texts.remove;
            }
            else if (col == 0) {
                html += '</div><div class="insertRowMenuAction ">';
                html += this.settings.texts.insert;
                if (this.nrofDataRows > 1) {
                    html += '</div><div class="deleteRowMenuAction">';
                }
                else {
                    html += '</div><div class="deleteRowDisabledMenuAction">';
                }
                html += this.settings.texts.remove;
            }
            else {

            }
            html += '</div></div>';
            this.$menuPopup = $(html);
            this.$element.append(this.$menuPopup);
            var pos = this._getAbsPosition(this.$btnParent, this.$menuPopup.outerWidth(), this.$menuPopup.height());
            this.$menuPopup.css(pos);
            this.$menuPopup.dialog({ modal: false });
            // Remove cell popup menu button
            this.$menuPopupBtn.remove();
            this.$menuPopupBtn = null;
            // Bind event handlers
            var self = this;
            this.$menuPopup.find('.cutMenuAction').on('click.table', function (ev) {
                ev.stopPropagation();
                self._onCutAction(cellEl, row, col);
            });
            this.$menuPopup.find('.copyMenuAction').on('click.table', function (ev) {
                ev.stopPropagation();
                self._onCopyAction(cellEl, row, col);
            });
            if (pasteAllowed) {
                this.$menuPopup.find('.pasteMenuAction').on('click.table', function (ev) {
                    ev.stopPropagation();
                    self._onPasteAction(cellEl, row, col);
                });
            }
            if (row == 0) {
                this.$menuPopup.find('.insertColMenuAction').on('click.table', function (ev) {
                    ev.stopPropagation();
                    self._onInsertColAction(cellEl, col);
                });
                if (this.nrofDataCols > 1) {
                    this.$menuPopup.find('.deleteColMenuAction').on('click.table', function (ev) {
                        ev.stopPropagation();
                        self._onDeleteColAction(col);
                    });
                }
            }
            else if (col == 0) {
                this.$menuPopup.find('.insertRowMenuAction').on('click.table', function (ev) {
                    ev.stopPropagation();
                    self._onInsertRowAction(cellEl, row);
                });
                if (this.nrofDataRows > 1) {
                    this.$menuPopup.find('.deleteRowMenuAction').on('click.table', function (ev) {
                        ev.stopPropagation();
                        self._onDeleteRowAction(row);
                    });
                }
            }
        },

        // Handle select
        _onCellClicked: function (el, row, col, mark) {
            // Render menu popup button and select the cell, the column or the row (whatever is appropriate).
            var leftPos = -2;
            var topPos = 25;
            this.$btnParent = $(el).parent();
            // Select column, row, or cell
            if (row == 0) {
                this._selectCol(col, mark);
                var $lastRow = this.$element.find('tbody tr:last');
                this.$btnParent = $lastRow.find('td').eq(col);
            }
            else if (col == 0) {
                this._selectRow(row, mark);
                this.$btnParent = $(el).parent().find('td:first');
            }
            else {
                this._selectCell(row, col, mark);
            }
            // Render a small popup menu button
            if (this.$menuPopupBtn) {
                this.$menuPopupBtn.remove();
            }
            this.$menuPopupBtn = $('<div class="dialogPopUp menuPopupBtn"></div>');
            this.$menuPopupBtn.css({ left: leftPos, top: topPos });
            this.$btnParent.append(this.$menuPopupBtn);
            this.$menuPopupBtn.dialog({ modal: false });
            // Bind event handler to the menu button
            var self = this;
            this.$menuPopupBtn.on('click.table', function (ev) {
                ev.stopPropagation();
                self._onMenuPopupBtnClicked(el, row, col);
            });
        },

        // Handle event occurring on <input> elements
        _onInputEvent: function (el, ev) {
            ev.stopPropagation();
            switch (ev.type) {
                case 'click':
                    var rowIndex = ($(el).parent().is('th')) ? 0 : $(el).parent().parent().index() + 1;
                    var colIndex = $(el).parent().index();
                    this._onCellClicked(el, rowIndex, colIndex);
                    break;
                case 'input':
                    this._unselect();
                    this._removeMenuPopupBtn();
                    this._clearClipBoard();
                    break;
            }
        },

        // Handle event occurring on the first cell of a row
        _onRowEvent: function (el, ev) {
            ev.stopPropagation();
            var rowIndex = $(el).parent().index() + 1;
            this._onCellClicked(el, rowIndex, 0);
        },

        // Create table from content array and show it
        _renderTable: function () {
            var self = this;
            var content = this.settings.content;
            if ( content && content.length != 0 ) {
                this.nrofDataCols = content[0].length;
                this.nrofDataRows = content.length - 1;
                var html = '<table class="flexTable ';
                html += this.settings.addTableClass;
                html += '">';
                if (this.settings.headerIncluded) {
                    html += '<thead><tr><th></th>';
                    for (var c = 0; c < this.nrofDataCols; c++)
                    {
                        html += '<th><input type="text" value="';
                        html += content[0][c];
                        html += '" placeholder="';
                        html +=  this.settings.texts.columnName;
                        html += '" /></th>';
                    }
                    html += '</tr></thead>';
                }
                html += '<tbody>';
                for (var r = 1; r < content.length; r++) {
                    html += '<tr><td><span>';
                    html += r;
                    html += '</span></td>';
                    for (var c = 0; c < this.nrofDataCols; c++) {
                        html += '<td><input type="text" value="';
                        html += content[r][c];
                        html += '" placeholder="..." /></td>';
                    }
                    html += '</tr>';
                }
                html += '</tbody></table>';
                this.$element.addClass('flexTableContainer');
                // Create table and append it to the container
                this.$table = $(html);
                this.$element.append(this.$table);

                // Bind event handlers
                this.$element.find('input').on('click.table input.table', function (ev) {
                    self._onInputEvent(this, ev);
                });
                this.$element.find('tbody td:first-child').on('click.table', function (ev) {
                    self._onRowEvent(this, ev);
                });
            }
            $('body').on('click.table keyup.table', function (ev) {
                if (ev.type == 'click') {
                    self._unselect();
                    self._removeMenuPopupBtn();
                }
                else if (ev.type == 'keyup') {
                    if (ev.keyCode === 27) {
                        self._clearClipBoard();
                        self._unselect();
                    }
                }
            });
            this.state = 'presented';
        },

        // Initialize
        _init: function (options) {
            var self = this;
            var defaults =
            {
                headerIncluded: true,
                addTableClass: "",
                texts: texts,
                onOpen: function () { },
                onClose: function () { }
            };
            this.settings = $.extend(defaults, options || {});
            this.nrofDataCols = 0;
            this.nrofDataRows = 0;
            this.clipBoard = null;
            this.state = 'initialized';
        },

        // Get the table cell data
        // Arguments: none
        getData: function (argsArray) {
            // Iterate table and push the input element values into a 'data' array
            // The array has the same format as the 'content' array passed in the plugin constructor.
            var dataArray = [];
            var $headRow = this.$element.find('thead tr');
            if ($headRow.length == 1) {
                var $inputs = $headRow.find('input');
                var rowData = [];
                for (var c = 0; c < $inputs.length; c++) {
                    var val = $($inputs[c]).val();
                    rowData.push(val);
                }
                dataArray.push(rowData);
                var $bodyRows = this.$element.find('tbody tr');
                for (var r = 0; r < $bodyRows.length; r++) {
                    $inputs = $($bodyRows[r]).find('input');
                    rowData = [];
                    for (var c = 0; c < $inputs.length; c++) {
                        var val = $($inputs[c]).val();
                        rowData.push(val);
                    }
                    dataArray.push(rowData);
                }
            }
            return dataArray;
        },

        // Close the table
        // Arguments: none
        close: function (argsArray) {
            this._unselectAll();
            this.$table.remove();
            $('body').off();
            this.state = 'closed';
        },

        // Destroy the plugin
        // Arguments: none
        destroy: function (argsArray) {
            this.close();
            $.removeData(this.$element[0], pluginName);
        },

    };

    $.fn[pluginName] = function (methodOrOptions) {
        var instance = $(this).data(pluginName);
        if (instance &&
            methodOrOptions &&
            typeof methodOrOptions != 'object' &&
            methodOrOptions.indexOf('_') != 0) {
            // Call method and return possible result value of the method
            return instance[methodOrOptions](Array.prototype.slice.call(arguments, 1));
        }
        if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            instance = new Plugin(this, methodOrOptions);
            $(this).data(pluginName, instance);
            return this;
        }
        $.error('Wrong call to ' + pluginName);
        return this;
    };

})(jQuery);

