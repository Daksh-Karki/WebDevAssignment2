document.addEventListener('DOMContentLoaded', () => {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const guestsInput = document.getElementById('guests');
    const searchButton = document.getElementById('Search');
    const bookButton = document.getElementById('booknowbutton');
    const smallBoxes = document.querySelectorAll('.small-box');
    const dialogBox = document.querySelector('.dialog-box');
    const TotalPrice = document.getElementById('cost');
    const summaryContent = document.getElementById('summary-content');
    const bookingSummaryModal = document.getElementById('bookingSummaryModal');
    const okButton = document.getElementById('okButton');
    let selectedBox = null;
    let selectedPricePerDay = 0; // Store selected area's price per day
    let selectedMaxCapacity = 0; // Store selected area's maximum capacity

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        checkinInput.setAttribute('min', today);
    }

    checkinInput.addEventListener('change', function() {
        const checkinDate = new Date(checkinInput.value);
        checkinDate.setDate(checkinDate.getDate() + 1);
        checkoutInput.value = checkinDate.toISOString().split('T')[0];
        checkoutInput.setAttribute('min', checkoutInput.value);

        // Recalculate total price if a box is selected
        if (selectedBox) {
            recalculateTotalPrice();
        }
    });

    checkoutInput.addEventListener('change', () => {
        // Recalculate total price if a box is selected
        if (selectedBox) {
            recalculateTotalPrice();
        }
    });

    window.onload = setTodayDate;

    function calculateDaysBetweenDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    }

    function recalculateTotalPrice() {
        const checkinDate = checkinInput.value;
        const checkoutDate = checkoutInput.value;

        // Only recalculate if both dates are valid
        if (checkinDate && checkoutDate) {
            const numberOfDays = calculateDaysBetweenDates(checkinDate, checkoutDate);
            const totalPrice = selectedPricePerDay * numberOfDays;
            TotalPrice.textContent = `$${totalPrice.toFixed(2)}`; // Format to 2 decimal places
        }
    }

    searchButton.addEventListener('click', () => {
        const numberOfGuests = parseInt(guestsInput.value);
        const checkinValue = checkinInput.value;
        const checkoutValue = checkoutInput.value;

        checkinInput.style.backgroundColor = "";
        checkoutInput.style.backgroundColor = "";
        guestsInput.style.backgroundColor = "";

        let isValid = true;

        if (!checkinValue) {
            checkinInput.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            isValid = false;
        }
        if (!checkoutValue) {
            checkoutInput.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            isValid = false;
        }
        if (isNaN(numberOfGuests) || numberOfGuests <= 0) {
            guestsInput.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            isValid = false;
        }

        if (!isValid) {
            alert('Please fill in all fields correctly.');
            return;
        }

        fetch('data.xml')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");
                const areas = xmlDoc.getElementsByTagName('area');

                smallBoxes.forEach((box, index) => {
                    if (index < areas.length) {
                        const area = areas[index];
                        const areaCapacity = parseInt(area.getElementsByTagName('capacity')[0].textContent);
                        const areaStatus = area.getElementsByTagName('status')[0].textContent;

                        if (areaStatus === 'Available' && numberOfGuests <= areaCapacity) {
                            box.style.backgroundColor = "rgba(0, 255, 0, 0.5)";
                        } else {
                            box.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
                        }

                        box.onclick = () => {
                            if (areaStatus === 'Available' && numberOfGuests <= areaCapacity) {
                                if (selectedBox) selectedBox.style.backgroundColor = "rgba(0, 255, 0, 0.5)";

                                selectedBox = box;
                                box.style.backgroundColor = "rgba(0, 0, 255, 0.5)";

                                const price = parseFloat(area.getElementsByTagName('price')[0].textContent);
                                const checkinDate = checkinInput.value;
                                const checkoutDate = checkoutInput.value;
                                const numberOfDays = calculateDaysBetweenDates(checkinDate, checkoutDate);
                                const totalPrice = price * numberOfDays;
                                TotalPrice.textContent = `$${totalPrice.toFixed(2)}`; // Format to 2 decimal places

                                // Store selected area information
                                selectedPricePerDay = price;
                                selectedMaxCapacity = areaCapacity;
                            }
                        };
                    }
                });
            })
            .catch(err => {
                console.error('Error fetching XML:', err);
                alert('Failed to load data. Please check the console for more details.');
            });
    });

    smallBoxes.forEach((box, index) => {
        box.addEventListener('mouseenter', () => {
            fetch('data.xml')
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data, "application/xml");
                    const area = xmlDoc.getElementsByTagName('area')[index];

                    if (area) {
                        const areaName = area.getElementsByTagName('name')[0].textContent;
                        const areaCapacity = area.getElementsByTagName('capacity')[0].textContent;
                        const areaStatus = area.getElementsByTagName('status')[0].textContent;
                        const areaPrice = area.getElementsByTagName('price')[0].textContent;
                        const areaImage = area.getElementsByTagName('image')[0].textContent;

                        dialogBox.innerHTML = 
                            `<div class="dialog-content">
                                <img class="dialog-img" src="${areaImage}" alt="${areaName}">
                                <div class="dialog-text">
                                    <h4>${areaName}</h4>
                                    <p>Status: ${areaStatus}</p>
                                    <p>Capacity: ${areaCapacity}</p>
                                    <p>Price per day: $${areaPrice}</p>
                                </div>
                            </div>`;
                        dialogBox.style.display = 'block';
                    }
                })
                .catch(err => console.error('Error fetching XML for hover:', err));
        });

        box.addEventListener('mouseleave', () => {
            dialogBox.style.display = 'none';
        });
    });

    bookButton.addEventListener('click', function(event) {
        event.preventDefault();

        if (selectedBox) {
            const checkinDate = checkinInput.value;
            const checkoutDate = checkoutInput.value;
            const numberOfGuests = parseInt(guestsInput.value);
            const totalPrice = parseFloat(TotalPrice.textContent.replace('$', ''));

            summaryContent.innerHTML = 
                `<strong>Booking Summary:</strong><br>
                Check-in: ${checkinDate}<br>
                Check-out: ${checkoutDate}<br>
                Guests: ${numberOfGuests}<br>
                Price per day: $${selectedPricePerDay.toFixed(2)}<br>
                Maximum Capacity: ${selectedMaxCapacity}<br>
                Total Price: $${totalPrice.toFixed(2)}<br>`;

            bookingSummaryModal.style.display = 'flex';

            okButton.onclick = () => {
                // Hide the booking summary modal
                bookingSummaryModal.style.display = 'none';
                
                // Reset all input fields
                checkinInput.value = '';
                checkoutInput.value = '';
                guestsInput.value = '';
                
                // Reset the total price display
                TotalPrice.textContent = '$0.00';
                
                // Reset selected box (if applicable)
                if (selectedBox) {
                    selectedBox.style.backgroundColor = "rgba(0, 255, 0, 0.5)";
                }
                selectedBox = null;
                
                // Optionally, reload the page to reset everything
                location.reload();
            };
        } else {
            alert('Please select an available area before booking.');
        }
    });
});
