
    script.
        const typeSelect = document.getElementById('schoolType');
        const belongsToField = document.getElementById('belongsToField');
        
        typeSelect.addEventListener('change', function() {
            const schoolType = this.value;
            
            // Show appropriate field based on type
            if (schoolType === 'school' || schoolType === 'board') {
                belongsToField.style.display = 'block';
                // fetch all boards from DB and populate dropdown
                const parentType = schoolType === 'school' ? 'board' : 'umbrella';
                const labelText = schoolType === 'school' ? 'Geen board' : 'Geen koepel';
                
                fetch(`/schools?type=${parentType}`)
                    .then(response => response.json())
                    .then(parents => {
                        const parentSelect = belongsToField.querySelector('select');
                        parentSelect.innerHTML = `<option value="">${labelText}</option>`;
                        parents.forEach(parent => {
                            const option = document.createElement('option');
                            option.value = parent._id;
                            option.textContent = parent.name;
                            parentSelect.appendChild(option);
                        });
                    });
            } else {
                belongsToField.style.display = 'none';
            }

        });
        
        // Trigger on page load to set initial state
        typeSelect.dispatchEvent(new Event('change'));
