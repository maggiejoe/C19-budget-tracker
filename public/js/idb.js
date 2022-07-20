let db;

const request = indexedDB.open('c19-budget-tracker', 1);

// if needed, create a new database
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// if database is created successfully, save in global variable
request.onsuccess = function(event) {
    db = event.target.result;

    // if app is online, run database function to send local files to api
    if (navigator.onLine) {
        uploadBudget();
    }
};

// if database creating is anything but successful, console log error
request.onerror = function(event) {
    console.log(event.garget.errorCode);
};

// if there is no network connection, save data to indexed.db
function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                
                // delete all records if successful
                budgetObjectStore.clear();
            })
            // if error, console log it
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);

