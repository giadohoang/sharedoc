import Identifier from './identifier';
import Char from './char';
import { start } from 'repl';

class CRDT {
    constructor(controller, base = 32, boundary = 10, strategy = 'random') {
        this.controller = controller;
        this.vector = controller.vector;
        this.struct = [[]];
        this.siteId = controller.siteId;
        this.base = base;
        this.boundary = boundary;
        this.strategy = strategy;
        this.strategyCache = [];
    }

    handleLocalInsert(value, pos) {
        this.vector.increment();
        const char = this.generateChar(value, pos);
        this.insertChar(char, pos);
        this.controller.broadcastInsertion(char);
    }

    handLeRemoteInsert(char) {
        const pos = this.findInsertPosition(char);
        this.insertChar(char, pos);
        this.controller.insertIntoEditor(char.value, pos, char.siteId);
    }


    //splice(start, deleteCount, items)
    //Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
    //@param start The zero-based location in the array from which to start removing elements.
    //@param deleteCount The number of elements to remove.
    //@param items Elements to insert into the array in place of the deleted elements.

    insertChar(char, pos) {
        if (pos.line === this.struct.length) {
            this.struct.push([]);
        }
        //if inserting a newline, split  line into two lines
        if (char.value === '\n') {
            const lineAfter = this.struct[pos.line].splice(pos.ch);

            if (lineAfter.length === 0) {
                this.struct[pos.line].splice(pos.ch, 0, char);
            } else {
                const lineBefore = this.struct[pos.line].concat(char);
                this.struct.splice(pos.line, 1, lineBefore, lineAfter);
            }
        }
        //if not a new line
        else {
            this.struct[pos.line].splice(pos.ch, 0, char);
        }
    }

    handleLocalDelete(startPos, endPos) {
        let chars;
        let newLineRemoved = false;

        //deleting multi lines
        if (startPos.line != endPos.line) {
            //delete chars on first line from startPos.ch to end of line
            newLineRemoved = true;
            chars = this.deleteMultipleLines(startPos, endPos);
        }
        //delete on single line
        else {
            chars = this.deleteSingleLine(startPos, endPos);
            if (chars.find(char => char.value === '\n')) newLineRemoved = true;
        }

        this.broadcast(chars);
        this.removeEmptyLines(); if (newLineRemoved && this.struct[startPos.line + 1]) {
            this.mergeLines(startPos.line);
        }
    }

    broadcast(chars) {
        chars.foreach(char => {
            this.vector.increment();
            this.controller.broadcastDeletion(char, this.vector.getLocalVersion());
        });
    }

    deleteMultipleLines(startPos, endPos) {
        let chars = this.struct[startPos.line].splice(startPos.ch);
        let line;

        for (line = startPos.line + 1; line < endPos.line; line++) {
            chars = chars.concat(this.struct[line].splice(0));
        }

        //todo for loop inside crdt
        if (this.struct[endPos.line]) {
            chars = chars.concat(this.struct[endPos.line].splice(0, endPos.ch));
        }
        return chars;
    }

    deleteSingleLine(startPos, endPos) {
        let charNum = endPos.ch - startPos.ch;
        let chars = this.struct[startPos.line].splice(startPos.ch, charNum);

        return chars;
    }

    //When deleting newline, concat line with next line
    mergeLines(line) {
        const mergedLines = this.struct[line].concat(this.struct[line + 1]);
        this.struct.splice(line, 2, mergedLines);
    }

    removeEmptyLines() {
        for (let line = 0; line < this.struct.length; line++) {
            if (this.struct[line].length === 0) {
                this.struct.splice(line, 1);
                line--;
            }
        }

        if (this.struct.length === 0) {
            this.struct.push([]);
        }
    }

    handleRemoteDelete(char, siteId) {
        const pos = this.findPosition(char);

        if (!pos) return;
        this.struct[pos.line].splice(pos.ch, 1);

        if (char.value === "\n" && this.struct[pos.line + 1]) {
            this.mergeLines(pos.line);
        }

        this.removeEmptyLines();
        this.controller.deleteFromEditor(char.value, pos, siteId);
    }

    isEmpty() {
        return this.struct.length === 1 && this.struct[0].length === 0;
    }








}