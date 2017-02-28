var currentModel;
var order = 1;

// An array of tuples of (word, frequency).
var tableData;
var pagesDisplayed = 0;
var pageSize = 100;
var startWordsHeader = 'Possible starting words';
var nextWordsHeader = 'Possible next words';

function loadJSON(pathToFile, callback) {
   var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
   xobj.open('GET', pathToFile, true);
   xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
   };
   xobj.send(null);
}

function clearScrollBox() {
    var scrollBox = document.getElementById('scroll-box');
    scrollBox.innerHTML = '';
    scrollBox.scrollTop = 0;
    pagesDisplayed = 0;
}

function clearInput(id) {
    var lastNWordsSearch = document.getElementById(id);
    lastNWordsSearch.value = '';
}

function reset() {
    clearScrollBox();
    removeTableSearchBar();
    clearInput('last-n-words-search')
}

function orderChanged() {
    var dropdown = document.getElementById('select-order');
    var selectedOrder = dropdown.options[dropdown.selectedIndex].value;
    order = parseInt(selectedOrder);
    currentModel = null;

    loadJSON('json/hp-order-' + order + '.json', function(responseText) {
        currentModel = JSON.parse(responseText);
    });

    reset();

    var searchBox = document.getElementById('last-n-words-search');
    if (order == 1) {
        searchBox.placeholder = 'Enter the last word of your sentence.';
    } else {
        searchBox.placeholder = 'Enter the last ' + order + ' words of your sentence.';
    }
}

// Sort by frequency, and then by alphabetical order in case of a tie
function freqAlphaSort(a, b) {
    var freqA = a[1]
    var freqB = b[1];
    if (freqA < freqB) {
        return 1;
    } else if (freqA > freqB) {
        return -1;
    } else {
        if (a[0].toLowerCase() < b[0].toLowerCase()) {
            return -1;
        } else if (a[0].toLowerCase() > b[0].toLowerCase()) {
            return 1;
        } else {
            return 0;
        }
    }
}

function addRowsToTable(table) {
    var startingPoint = pageSize*pagesDisplayed;
    var rowsToAdd = Math.min(tableData.length - startingPoint, pageSize);
    for (var i = startingPoint; i < startingPoint + rowsToAdd; i++) {
        var wordCell = document.createElement('td');
        var wordText = document.createTextNode(tableData[i][0]);
        wordCell.appendChild(wordText);

        var freqCell = document.createElement('td');
        var freqText = document.createTextNode(tableData[i][1]);
        freqCell.appendChild(freqText);

        var row = document.createElement('tr');
        row.appendChild(wordCell);
        row.appendChild(freqCell)
        table.appendChild(row)
    }
    if (rowsToAdd > 0) {
        pagesDisplayed += 1;
    }
}

function addTableSearchBar() {
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'table-search';
    searchInput.placeholder = 'Search the options in the table';

    var scrollBox = document.getElementById('scroll-box');
    scrollBox.classList.add('table-with-search');

    var rightColumn = document.getElementById('right-column');
    rightColumn.appendChild(searchInput);

    document.getElementById('table-search').onkeyup = function(e){
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        var searchTerm = e.target.value.trim();

        if (searchTerm.length == 0) {
            var currentHeaderText = document.getElementById('left-table-header').textContent;
            if (currentHeaderText == startWordsHeader) {
                displayStartStates();
            } else {
                displayNextWords();
            }
        } else {
            searchTableData(searchTerm);
        }
    }
}

function removeTableSearchBar() {
    var tableSearch = document.getElementById('table-search');
    if (tableSearch) {
        document.getElementById('right-column').removeChild(tableSearch);
        var scrollBox = document.getElementById('scroll-box');
        scrollBox.classList.remove('table-with-search');
    }
}

// Display a table given a mapping of words to frequencies + a header label.
function displayTable(data, leftHeaderLabel) {
    clearScrollBox();

    var wordTable = document.createElement('table')
    wordTable.id = 'word-table';
    document.getElementById('scroll-box').appendChild(wordTable);

    var leftHeader = document.createElement('th');
    leftHeader.id = 'left-table-header';
    var leftLabel = document.createTextNode(leftHeaderLabel);
    leftHeader.appendChild(leftLabel);

    var rightHeader = document.createElement('th');
    var rightLabel = document.createTextNode('# of occurrences in Harry Potter');
    rightHeader.appendChild(rightLabel);

    var headerRow = document.createElement('tr');
    headerRow.appendChild(leftHeader);
    headerRow.appendChild(rightHeader);
    wordTable.appendChild(headerRow);

    // Sort the possible next words by frequency and alphabetical order
    var wordFreqList = [];
    for (word in data) {
        wordFreqList.push([word, data[word]]);
    }
    tableData = wordFreqList.sort(freqAlphaSort);

    addRowsToTable(wordTable);

    if (!document.getElementById('table-search')) {
        addTableSearchBar();
    }
}

function displayStartStates() {
    if (currentModel == null) {
        return;
    }
    clearInput('last-n-words-search');
    displayTable(currentModel['startStates'], startWordsHeader)
}

function displayMessage(text) {
    clearScrollBox();
    removeTableSearchBar();

    var messageText = document.createTextNode(text);
    var messageDiv = document.createElement('div');
    messageDiv.id = 'message';
    messageDiv.appendChild(messageText);

    document.getElementById('scroll-box').appendChild(messageDiv);
}

function displayNextWords() {
    var tableSearch = document.getElementById('table-search');
    if (tableSearch) {
        clearInput('table-search');
    }

    var searchTerm = document.getElementById('last-n-words-search').value.trim();

    var searchTermLength = searchTerm.split(' ').length;
    var explanation = 'Your search should have exactly ' + order + ' word' + (order > 1 ? 's' : '') + '.'
    if (searchTerm.length == 0 || searchTermLength < order) {
        displayMessage('That doesn\'t seem to be enough words. ' + explanation);
        return;
    }
    if (searchTermLength > order) {
        displayMessage('That\'s too many words. ' + explanation);
        return;
    }

    if (currentModel['endStates'].includes(searchTerm)) {
        displayMessage('You\'ve reached the end of the sentence!');
        return;
    }

    if (currentModel == null) {
        return;
    }

    var searchTermNextWords = currentModel['wordStats'][searchTerm];
    if (searchTermNextWords == undefined || searchTermNextWords.length == 0) {
        displayMessage('The text you searched does not appear in the data set.');
        return;
    }

    displayTable(searchTermNextWords, nextWordsHeader);
}

function searchTableData(searchTerm) {
    var searchData = {};
    for (var i = 0; i < tableData.length; i++) {
        var state = tableData[i][0];
        if (state.includes(searchTerm)) {
            searchData[state] = tableData[i][1];
        }
    }
    var currentHeaderText = document.getElementById('left-table-header').textContent;
    if (Object.keys(searchData).length == 0) {
        displayTable({'Oops! None of the options contain that text.': ''}, currentHeaderText);
    } else {
        displayTable(searchData, currentHeaderText);
    }
}

loadJSON('json/hp-order-1.json', function(responseText) {
    currentModel = JSON.parse(responseText);
});

displayMessage('Use the controls on the left to get started!');

// Search when the user presses enter in the input
document.getElementById('last-n-words-search').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
        displayNextWords();
    }
}

document.getElementById('scroll-box').onscroll = function(e) {
    var table = document.getElementById('word-table');
    var nearBottom = e.target.scrollTop > (e.target.scrollHeight - e.target.offsetHeight - 400);
    if (table != null && nearBottom) {
        addRowsToTable(document.getElementById('word-table'));
    }
};
