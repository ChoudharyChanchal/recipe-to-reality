let FinalProduct = "";

// Utility function to create styled elements
function createStyledElement(tag, style, innerText = "") {
  const element = document.createElement(tag);
  Object.assign(element.style, style);
  if (innerText) element.innerText = innerText;
  return element;
}

// Utility styles
const sidebarStyle = {
  position: "fixed",
  zIndex: "9999",
  top: "0",
  right: "0",
  width: "300px",
  backgroundColor: "#f4f4f4",
  borderLeft: "1px solid #ccc",
  padding: "20px",
  boxShadow: "-2px 0px 5px rgba(0, 0, 0, 0.1)",
  display: "flex",
  flexDirection: "column",  // Use flexbox layout
  gap: "10px",  // Space between elements
  maxHeight: "100%",  // Allow it to grow as much as needed
  overflowY: "auto",  // Add scrolling if needed
  height: "auto",  // Let the height adjust based on the content
};

const buttonStyle = {
  width: "100%",
  padding: "10px 15px",
  border: "none",
  cursor: "pointer",
  borderRadius: "5px",
  color: "white",
  margin: "10px 0",
  textAlign: "center",
  display: "none"  // Initially hide the buttons
};

const containerStyle = {
  backgroundColor: "white",
  padding: "10px 15px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  maxHeight: "400px",
  overflowY: "auto",
  display: "none"  // Initially hide the ingredients container
};

// Variables
let cleanedIngredients = [];
let finalDone = 0;

// Create Sidebar
const sidebar = createStyledElement("div", sidebarStyle);
document.body.appendChild(sidebar);
sidebar.style.display = "none";

const smallButtonStyle = {
  ...buttonStyle,
  padding: "5px 10px",  // Make the button smaller
  fontSize: "14px",      // Reduce the font size
};
// Create close button (x icon) for the sidebar
const closeButtonStyle = {
  position: "absolute",
  top: "5px",
  right: "10px",
  backgroundColor: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#333",
};

const closeButton = createStyledElement("button", closeButtonStyle, "×");
sidebar.appendChild(closeButton);
closeButton.style.display = "none";

// Create and append button and containers to the sidebar
const ingredientsButton = createStyledElement("button", {
  ...buttonStyle,
  backgroundColor: "#4CAF50"
}, "Want to order ingredients?");
sidebar.appendChild(ingredientsButton);
ingredientsButton.style.display = "none";

const ingredientsListContainer = createStyledElement("div", containerStyle);
sidebar.appendChild(ingredientsListContainer);
ingredientsListContainer.style.display = "none";

const alternativeContainer = createStyledElement("div", containerStyle);
sidebar.appendChild(alternativeContainer);
alternativeContainer.style.display = "none";

const finaliseContainer = createStyledElement("div", containerStyle);
sidebar.appendChild(finaliseContainer);
finaliseContainer.style.display = "none";

const allergyButton = createStyledElement("button", {
  ...buttonStyle,
  backgroundColor: "#FF6347"
}, "Get alternative ingredient suggestions");
sidebar.appendChild(allergyButton);

const finalizeButton = createStyledElement("button", {
  ...buttonStyle,
  backgroundColor: "#4CAF50"
}, "Finalize");
sidebar.appendChild(finalizeButton);

const removeIngButton = createStyledElement("button", {
  ...buttonStyle,
  backgroundColor: "#4CAF50"
}, "Remove ingredient from shopping list");
sidebar.appendChild(removeIngButton);

// Define the observer function
// Define the observer function
const observerFunction = () => {
  const description = document.querySelector('ytd-text-inline-expander');
  if (!description) return;

  const youtubeDescription = description.innerText;
  console.log('YouTube Description:', youtubeDescription);

  sidebar.style.display = "block";
  closeButton.style.display = "block";
  ingredientsButton.style.display = "block";
  // ingredientsListContainer.style.display = "block";
  // alternativeContainer.style.display = "block";

  // Step 3: Add event listener to the button
  ingredientsButton.addEventListener("click", () => handleIngredientsClick(youtubeDescription, ingredientsListContainer));
  ingredientsButton.style.display = "block"; // Show the button when description is available
  observer.disconnect(); // Stop observing once we've found the description
};

// Define the observer outside of the event listener to avoid scoping issues
const observer = new MutationObserver(observerFunction);

// Add click event listener to ingredientsButton
ingredientsButton.addEventListener("click", () => {
  // Start observing when the button is clicked
  observer.observe(document.body, { childList: true, subtree: true });
});

// Handler for ingredients button click
function handleIngredientsClick(description, container) {
  ingredientsButton.disabled = true;

  let fullDescription = "";

  // Select the '...more' button using the appropriate selector
  const moreButton = document.querySelector('tp-yt-paper-button#expand');
  if (moreButton) {
    //console.log("Found '...more' button. Clicking to expand...");
    moreButton.click(); // Programmatically click the button

    // Wait for the full description to load
    setTimeout(() => {
      const expandedDescriptionElement = document.querySelector('ytd-text-inline-expander');
      if (expandedDescriptionElement) {
        fullDescription = expandedDescriptionElement.innerText;
        //console.log("Full YouTube Description:", fullDescription);
        const prompt = `List the ingredients I should order without measurements to make this dish: ${fullDescription}`;
        chrome.runtime.sendMessage({ message: "lookup_ai", prompt });
        // Show "Thinking..." in the box while waiting for the response
        container.innerHTML = "Thinking...";
      } else {
        console.error("Expanded description element not found.");
      }
    }, 1000); // Adjust delay as needed (e.g., 1000ms)
  }
  
  container.style.display = "block"; // Show ingredients container
}

// Listener for background messages
chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "ingredients_list_generated") {
    handleIngredientsListGenerated(request);
  } else if (request.message === "alternative_generated") {
    handleAlternativeGenerated(request);
  }else if (request.message === "productname_generated")
  {
    handleFinalisedProduct(request);
  }else if (request.message === "productname_not_generated")
  {
    handleFinalisedProductRegexMatch(request);
  }else if  (request.message === "print_message")
  {
    handleStartedMsg(request);
  }
});

function handleStartedMsg(request)
{
  // Create and style the message container
  const createMessageContainer = () => {
    const messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '10px';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translateX(-50%)';
    messageContainer.style.padding = '15px';
    messageContainer.style.backgroundColor = '#4CAF50';  // Change to green for visibility
    messageContainer.style.color = '#ffffff';  // White text color
    messageContainer.style.borderRadius = '5px';
    messageContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    messageContainer.style.zIndex = '9999';
    messageContainer.style.fontSize = '16px';  // Bigger font size
    messageContainer.style.fontFamily = 'Arial, sans-serif';
    messageContainer.style.textAlign = 'center';
    messageContainer.style.minWidth = '200px';  // Set minimum width
    messageContainer.style.maxWidth = '400px';  // Max width for longer text
    messageContainer.style.whiteSpace = 'normal';  // Allow wrapping of text

    const msg = request.msg;
    // Set default message initially
    messageContainer.textContent = msg;

    // Append to the body and log to confirm creation
    document.body.appendChild(messageContainer);
    console.log('Message container created with default message');
  };
}
// Utility to escape special characters in RegExp
//function escapeRegExp(string) {
//  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
//}
const escapeRegExp = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");  // Function to escape special regex characters

function handleFinalisedProduct(request) {
  // Retrieve the final product name
  const FinalProduct = request.productName;
  let FinalProductName = FinalProduct[0];
  FinalProductName = FinalProductName.replace(/\*\*/g, "");
  console.log("Final product: ", FinalProductName);

  const myCurrentItem = request.myCurrentItem;
  const topProductTitles = request.topProductTitles;
  console.log("Product tiles : ", topProductTitles);

  let noItem = 0;
  let discard = 0;

  // Create a flexible RegExp to match all words in FinalProductName
  //const words = FinalProductName.split(/\s+/); //Split by spaces
  //const regex = new RegExp(words.map(word => `\\b${word}\\b`).join(".*"), "i"); 
  // Create a flexible RegExp to match all words in FinalProductName
  //const words = FinalProductName.split(/\s+/).map(escapeRegExp); // Split by spaces and escape special characters
  //const regex = new RegExp(words.map(word => `\\b${word}\\b`).join(".*"), "i");
  //console.log("Matching product regex :", regex);

  // Matches all words in order with possible characters in between

  // Use find to get the matching element
  //const matchingProduct = topProductTitles.find(title => regex.test(title));

  //////
  // Split FinalProductName into words and clean special characters like apostrophes
  const words = FinalProductName.split(/\s+/).map(word => word.replace(/['"]/g, ''));
  // Use find to get the matching element
  const matchingProduct = topProductTitles.find(title => {
    // Clean the title by removing special characters like apostrophes
    const cleanedTitle = title.replace(/['"]/g, '').toLowerCase();
    // Check if all words are present in the cleaned title
    return words.every(word => cleanedTitle.includes(word.toLowerCase()));
  });
  //////

  if (matchingProduct) {
      console.log("Matching product:", matchingProduct);
  } else {
      console.log("No matching product found.");
      noItem = 1;
  }
  
  // If there are no valid products, handle as not found and move to the next item
  if ((!FinalProductName || FinalProductName.trim() === "") || (noItem === 1) || (discard === 1) ) {
      console.log("No valid products to select. Moving to the next item.");
      chrome.runtime.sendMessage(
        { action: "add_to_not_found", item: myCurrentItem },
        (response) => {
          if (response && response.status === "success") {
            console.log("NotFound updated in background.js:", response.notFound);
          }
        }
      );
      console.log("Notifying the background script to move to the next item...");
      chrome.runtime.sendMessage({ action: "process_next_item" });
      return;
  }

  /*
  // Function to simulate a click on the target product
  const clickProduct = () => {
    // Select all elements where class starts with 'Product__UpdatedTitle-sc'
    const productElements = document.querySelectorAll('[class^="Product__UpdatedTitle-sc"]');

    // Find the product with the exact name
    const targetProduct = Array.from(productElements).find(
      (el) => el.textContent.trim() === matchingProduct
    );

    if (targetProduct) {
      // Simulate a click
      targetProduct.click();
      console.log("Clicked on the product");
    
      // Wait for an element to appear on the page
      const waitForElement = (selector, callback, timeout = 3000) => {
        const start = Date.now();
        let interval;
    
        // Start checking for the element
        interval = setInterval(() => {
          const element = document.querySelector(selector);
          
          if (element) {
            clearInterval(interval);  // Clear the interval once the element is found
            callback(element);
          } else if (Date.now() - start > timeout) {
            clearInterval(interval);  // Clear the interval if the timeout is reached
            console.log(`Timeout waiting for element: ${selector}`);
            console.log("Moving on");
            
            console.log("No valid products to select. Moving to next item.");
            
            // Notify background script to move to the next item
            chrome.runtime.sendMessage(
              { action: "add_to_not_found", item: myCurrentItem },
              (response) => {
                if (response && response.status === "success") {
                  console.log("NotFound updated in background.js:", response.notFound);
                }
              }
            );
            console.log("Notifying the background script to move to the next item...");
            chrome.runtime.sendMessage({ action: "process_next_item" });
          }
        }, 200); // Check every 200 ms
      };
    
      // Step 5: Wait for the "ADD" button and click it
      waitForElement('[class*="AddToCart__UpdatedButtonContainer-sc"]', async (addButton) => {
        if (addButton) {
          console.log("ADD button found. Adding product to the cart...");
          addButton.click();
          console.log("Product added to cart.");
    
          // Wait for 3 seconds before notifying the background script
          // await sleep(500);
    
          console.log("Notifying the background script to move to the next item...");
          chrome.runtime.sendMessage({ action: "process_next_item" });
        }
      }, 1000); // Timeout set to 3000 ms for waiting ADD button
    }
    
  };
  */
  // Define the sleep function outside of the main function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clickProduct = async () => {
  // Select all elements where class starts with 'Product__UpdatedTitle-sc'
  const productElements = document.querySelectorAll('[class^="Product__UpdatedTitle-sc"]');

  // Find the product with the exact name
  const targetProduct = Array.from(productElements).find(
    (el) => el.textContent.trim() === matchingProduct
  );

  if (targetProduct) {
    // Wait for 1 second before clicking the product (you can adjust the time)
    console.log("Waiting before clicking the product...");
    await sleep(500); // Sleep for 1 second

    // Simulate a click
    targetProduct.click();
    console.log("Clicked on the product");

    // Wait for an element to appear on the page
    const waitForElement = (selector, callback, timeout = 3000) => {
      const start = Date.now();
      let interval;

      // Start checking for the element
      interval = setInterval(() => {
        const element = document.querySelector(selector);
        
        if (element) {
          clearInterval(interval);  // Clear the interval once the element is found
          callback(element);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);  // Clear the interval if the timeout is reached
          console.log(`Timeout waiting for element: ${selector}`);
          console.log("Moving on");

          console.log("No valid products to select. Moving to next item.");
          
          // Notify background script to move to the next item
          chrome.runtime.sendMessage(
            { action: "add_to_not_found", item: myCurrentItem },
            (response) => {
              if (response && response.status === "success") {
                console.log("NotFound updated in background.js:", response.notFound);
              }
            }
          );
          console.log("Notifying the background script to move to the next item...");
          chrome.runtime.sendMessage({ action: "process_next_item" });
        }
      }, 200); // Check every 200 ms
    };

    // Step 5: Wait for the "ADD" button and click it
    waitForElement('[class*="AddToCart__UpdatedButtonContainer-sc"]', async (addButton) => {
      if (addButton) {
        console.log("ADD button found. Waiting before adding product to the cart...");

        // Wait for 1 second (or adjust the duration) before clicking
        await sleep(500); // Sleep for 1 second

        console.log("Adding product to the cart...");
        addButton.click();
        console.log("Product added to cart.");

        // Notify the background script to move to the next item
        console.log("Notifying the background script to move to the next item...");
        chrome.runtime.sendMessage({ action: "process_next_item" });
      }
    }, 1000); // Timeout set to 1000 ms for waiting for ADD button
  }
};

  
  // Wait for products to load, check periodically
  const waitForProduct = () => {
    const timeout = 5000; // Adjust as needed
    const interval = 500; // Check every 500ms
    let elapsedTime = 0;

    const intervalId = setInterval(() => {
      elapsedTime += interval;
      if (clickProduct() || elapsedTime >= timeout) {
        clearInterval(intervalId); // Stop checking
        if (elapsedTime >= timeout) {
          console.error("Product not found within the timeout period.");
        }
      }
    }, interval);
  };

  // Ensure DOM is ready before executing the logic
  if (document.readyState === "complete" || document.readyState === "interactive") {
    console.log("DOM already loaded. Proceeding...");
    waitForProduct();
  } else {
    console.log("Waiting for DOM to load...");
    document.addEventListener("DOMContentLoaded", waitForProduct);
  }
}

function handleFinalisedProductRegexMatch(request)
{
  const myCurrentItem = request.myCurrentItem;
  const topProductTitles = request.topProductTitles;
  console.log("Product tiles : ", topProductTitles);
  console.log("myCurrentItem : ", myCurrentItem);

  // Step 3: Filter products based on the current search query (myCurrentItem)
  const myCurrentItemWords = myCurrentItem.split(" "); // Split the query into individual words
  let finalProductsList = []; // Array to store valid products
      
  topProductTitles.forEach((productName) => {
    let discard = 0; // Initialize discard flag

    // Check each word in the myCurrentItemWords array
    myCurrentItemWords.forEach((word) => {
      // Modify the regex to match any part of the product name (.*word.*)
      const regex = new RegExp(".*" + word + ".*", "i"); // Case-insensitive match for word within the product name
      if (!regex.test(productName)) {
        discard = 1; // Set discard flag to 1 if there's NO match
      }
    });

    // If discard is still 0, add the product to finalProductsList (meaning no word matched)
    if (discard === 0) {
      finalProductsList.push(productName);
    }
  });

  console.log("finalProductsList:", finalProductsList);

 // If there are no valid products in finalProductsList, stop here
  if (finalProductsList.length === 0) {
    console.log("No valid products to select. Moving to next item.");
    chrome.runtime.sendMessage(
      { action: "add_to_not_found", item: myCurrentItem },
      (response) => {
          if (response && response.status === "success") {
              console.log("NotFound updated in background.js:", response.notFound);
          }
      });
    console.log("Notifying the background script to move to the next item...");
    chrome.runtime.sendMessage({ action: "process_next_item" });
    return;
  }

  // Proceed with selecting and adding the first valid product
  const firstValidProduct = finalProductsList[0];
  console.log(`Selecting product: ${firstValidProduct}`);
  
  // Function to simulate a click on the target product
  const clickProduct = () => {
    // Select all elements where class starts with 'Product__UpdatedTitle-sc'
    const productElements = document.querySelectorAll('[class^="Product__UpdatedTitle-sc"]');

    // Find the product with the exact name
    const targetProduct = Array.from(productElements).find(
      (el) => el.textContent.trim() === firstValidProduct
    );

    if (targetProduct) {
      // Simulate a click
      targetProduct.click();
      console.log("Clicked on the product");
      
      // Wait for an element to appear on the page
      const waitForElement = (selector, callback, timeout = 3000) => {
        const start = Date.now();
        const interval = setInterval(() => {
          const element = document.querySelector(selector);
          if (element) {
            clearInterval(interval);
            callback(element);
          } else if (Date.now() - start > timeout) {
            clearInterval(interval);
            console.log(`Timeout waiting for element: ${selector}`);
            console.log("Moving on");
              console.log("No valid products to select. Moving to next item.");
              chrome.runtime.sendMessage(
                { action: "add_to_not_found", item: myCurrentItem },
                (response) => {
                    if (response && response.status === "success") {
                        console.log("NotFound updated in background.js:", response.notFound);
                    }
                });
              console.log("Notifying the background script to move to the next item...");
              chrome.runtime.sendMessage({ action: "process_next_item" });
              return;
          }
        }, 200); // Check every 200 ms
      };

      // Step 5: Wait for the "ADD" button and click it
      waitForElement('[class*="AddToCart__UpdatedButtonContainer-sc"]', async (addButton) => {
        console.log("ADD button found. Adding product to the cart...");
        addButton.click();
        console.log("Product added to cart.");

        // Wait for 3 seconds before notifying the background script
        //await sleep(500);

        console.log("Notifying the background script to move to the next item...");
        chrome.runtime.sendMessage({ action: "process_next_item" });
      }, 500); // Timeout set to 3000 ms for waiting ADD button
    }
  };

  // Wait for products to load, check periodically
  const waitForProduct = () => {
    const timeout = 5000; // Adjust as needed
    const interval = 500; // Check every 500ms
    let elapsedTime = 0;

    const intervalId = setInterval(() => {
      elapsedTime += interval;
      if (clickProduct() || elapsedTime >= timeout) {
        clearInterval(intervalId); // Stop checking
        if (elapsedTime >= timeout) {
          console.error("Product not found within the timeout period.");
        }
      }
    }, interval);
  };

  // Ensure DOM is ready before executing the logic
  if (document.readyState === "complete" || document.readyState === "interactive") {
    console.log("DOM already loaded. Proceeding...");
    waitForProduct();
  } else {
    console.log("Waiting for DOM to load...");
    document.addEventListener("DOMContentLoaded", waitForProduct);
  }
  
}

function handleIngredientsListGenerated(request) {
  console.log("Received ingredients list:", request.ingredients);

  cleanedIngredients = request.ingredients
  .filter(line => 
    !line.startsWith("Here's") && 
    !line.startsWith("**") && 
    line.startsWith("*") && 
    !line.toLowerCase().includes("water") && 
    !line.includes("You ") && 
    !line.includes(" you ")
  )
  .map(item => {
    // Step 1: Remove all elements within parentheses (including the parentheses)
    let withoutParentheses = item.replace(/\([^)]*\)/g, "");

    // Step 2: Split on the first comma and keep only the part before it
    const [beforeComma] = withoutParentheses.split(',');

    // Step 3: Clean up leading asterisk and trim spaces
    return beforeComma
      .replace(/^\*\s*/, "") // Remove leading asterisk
      .trim(); // Clean up extra spaces
  });

  console.log("Filtered ingredients part 1:", cleanedIngredients);

  cleanedIngredients = cleanedIngredients.map(item => item.replace(/^\*\*|\*\*$/g, "").trim());

  console.log("Filtered ingredients part 2:", cleanedIngredients);

  cleanedIngredients = cleanedIngredients.map(item => item.split('**')[0]);

  console.log("Filtered ingredients part 3 :", cleanedIngredients);

  ingredientsListContainer.innerHTML = cleanedIngredients.length
    ? `<strong>Ingredients:</strong><ul>${cleanedIngredients.map(i => `<li>${i}</li>`).join("")}</ul>`
    : "No ingredients found.";

  // Show allergy and finalize buttons if ingredients are found
  createAllergyButtons();
}

function createAllergyButtons() {
  //ingredientsButton.disabled = true;
  ingredientsButton.style.display = "none";

  allergyButton.style.display = "block"; // Show allergy button
  finalizeButton.style.display = "block"; // Show finalize button
  removeIngButton.style.display = "block";

  allergyButton.addEventListener("click", () => handleAllergyButtonClick());
  finalizeButton.addEventListener("click", () => handleFinalizeButtonClick());
  removeIngButton.addEventListener("click", () => handleRemoveIngButtonClick());
}

function handleRemoveIngButtonClick() {
  console.log("Remove ingredient button clicked");

  // Check if a remove ingredient container already exists
  const existingContainer = document.querySelector(".remove-ing-container");
  if (existingContainer) {
    // If it exists, display it again
    existingContainer.style.display = "block";
    return;
  }

  // Create a container for the new text box
  const removeIngContainer = createStyledElement("div", containerStyle);
  removeIngContainer.classList.add("remove-ing-container"); // Add a class for identification
  sidebar.appendChild(removeIngContainer);
  removeIngContainer.style.display = "block";

  // Create a text box for user input
  const inputBox = document.createElement("input");
  inputBox.type = "text";
  inputBox.placeholder = "Enter ingredient to remove";
  inputBox.style.marginRight = "10px";
  removeIngContainer.appendChild(inputBox);

  // Create a button to confirm the input
  const confirmButton = document.createElement("button");
  confirmButton.textContent = "Confirm";
  removeIngContainer.appendChild(confirmButton);

  // Add an event listener to handle the button click
  confirmButton.addEventListener("click", () => {
    const enteredRemove = inputBox.value.trim();

    // Check if the input is valid
    if (!enteredRemove) {
      alert("Please enter a valid ingredient to remove.");
      return;
    }

    // Log the input to the console
    console.log("Entered ingredient to remove:", enteredRemove);

    // Remove entered ingredient if present in the ingredients list
    /*const removeRegex = new RegExp(enteredRemove, 'i');
    cleanedIngredients = cleanedIngredients.filter(ingredient => 
      !removeRegex.test(ingredient) // Keep ingredients that don't match the regex
    );*/
    // Remove entered ingredient if present in the ingredients list
    cleanedIngredients = cleanedIngredients.filter(ingredient => 
      ingredient.trim().toLowerCase() !== enteredRemove.trim().toLowerCase()
    );

    console.log("Updated ingredients:", cleanedIngredients);

    // Update the displayed list
    ingredientsListContainer.innerHTML = `<strong>Ingredients:</strong><ul>${cleanedIngredients.map(i => `<li>${i}</li>`).join("")}</ul>`;

    inputBox.value = "";

    // Hide the container after confirmation
    removeIngContainer.remove();
  });
}

function handleAllergyButtonClick() {
  const allergy = prompt("Enter the ingredient name:");
  allergyButton.disabled = true;
  if (allergy) {
    const allergyPrompt = `Suggest alternative ingredient for ${allergy}`;
    chrome.runtime.sendMessage({
      message: "suggest_alternative",
      prompt: allergyPrompt,
      allergy
    });

    alternativeContainer.innerHTML = "Thinking for replacements...";
    alternativeContainer.style.display = "block";
  }
}

function handleFinalizeButtonClick() {
  if(finalDone === 0){
    finalDone = 1;
    finaliseContainer.style.display = "block";
    finaliseContainer.innerHTML = "Ordering ingredients in new tab.\nYou may now close this pop up.";
    finalizeButton.disabled = true;
    console.log("Finalizing ingredients:", cleanedIngredients);
    if (allergyButton) allergyButton.remove();
    if (finalizeButton) finalizeButton.remove();
    if (removeIngButton) removeIngButton.remove();
    isBlinkit = 1;
    ingredientsListContainer.innerHTML = `<strong>Finalized Ingredients:</strong><ul>${cleanedIngredients.map(i => `<li>${i}</li>`).join("")}</ul>`;
    chrome.runtime.sendMessage({ message: "update_items", ingredients: cleanedIngredients });
  }
}

function handleAlternativeGenerated(request) {
  alternativeContainer.innerHTML = `
    <strong>Alternative for ingredient:</strong> ${request.replacement}<br>
    <label for="alternativeInput">Enter alternative from suggested items:</label><br>
    <input id="alternativeInput" type="text" placeholder="Type your choice here" style="margin: 10px 0; padding: 5px; width: 90%;"/><br>
    <button id="selectAlternative" style="padding: 5px 10px; background-color: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 5px;">Select This</button>
    <button id="keepOldIngredient" style="padding: 5px 10px; background-color: #FF6347; color: white; border: none; cursor: pointer; border-radius: 5px; margin-left: 5px;">Keep Old Ingredient</button>
  `;

  document.getElementById("selectAlternative").addEventListener("click", () => handleSelectAlternative(request));
  document.getElementById("keepOldIngredient").addEventListener("click", () => handleKeepOldIngredient());
}

function handleSelectAlternative(request) {
  const enteredAlternative = document.getElementById("alternativeInput").value.trim();
  if (!enteredAlternative) {
    alert("Please enter a valid alternative ingredient.");
    return;
  }

  const allergyRegex = new RegExp(request.allergy, 'i');
  cleanedIngredients = cleanedIngredients.map(ingredient =>
    allergyRegex.test(ingredient) ? enteredAlternative : ingredient
  );

  console.log("Updated ingredients:", cleanedIngredients);

  ingredientsListContainer.innerHTML = `<strong>Ingredients:</strong><ul>${cleanedIngredients.map(i => `<li>${i}</li>`).join("")}</ul>`;

  alternativeContainer.style.display = "none";
  allergyButton.disabled = false;
}

function handleKeepOldIngredient() {
  console.log("Keeping the old ingredient.");

  ingredientsListContainer.innerHTML = `<strong>Ingredients:</strong><ul>${cleanedIngredients.map(i => `<li>${i}</li>`).join("")}</ul>`;

  alternativeContainer.style.display = "none";
  allergyButton.disabled = false;
}

// Event listener for the close button
closeButton.addEventListener("click", () => {

  sidebar.style.display = "none";  // Hides the sidebar when the close button is clicked
  closeButton.remove();  // Optionally remove the close button
  //chrome.runtime.sendMessage({ action: "stopBackgroundProcessing" });
});

// Start observing the document
observer.observe(document.body, { childList: true, subtree: true });


// =================== Blinkit Product Automation Logic ===================

//if (window.location.href.match(/^https:\/\/blinkit\.com\/s\/\?q=.*/)) {
if (window.location.pathname === "/s/" && window.location.search.startsWith("?q=")) {
  console.log("Running Blinkit automation script.");

  window.addEventListener("load", () => {
      console.log("Site loaded. Starting product search...");
    
      // Extract the query item from the URL (assuming the URL structure is "https://blinkit.com/s/?q=QUERY")
      const urlParams = new URLSearchParams(window.location.search);
      const myCurrentItem = urlParams.get("q") || ""; // Get query parameter "q"
    
      if (!myCurrentItem) {
        console.log("No search query found in the URL.");
        return;
      }
    
      console.log(`Current search item: ${myCurrentItem}`);
    
      // Selector for the products list container (static part of the class name)
      const productsListSelector = '[class*="ProductsContainer__SearchProductsListContainer-sc"]';
    
      // Sleep function to introduce delays
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
      ///////
      
      
      // Wait for an element to appear on the page
      const waitForElement = (selector, callback, timeout = 3000) => {
        const start = Date.now();
        const interval = setInterval(() => {
          const element = document.querySelector(selector);
          if (element) {
            clearInterval(interval);
            callback(element);
          } else if (Date.now() - start > timeout) {
            clearInterval(interval);
            console.log(`Timeout waiting for element: ${selector}`);
            console.log("Moving on");
              console.log("No valid products to select. Moving to next item.");
              chrome.runtime.sendMessage(
                { action: "add_to_not_found", item: myCurrentItem },
                (response) => {
                    if (response && response.status === "success") {
                        console.log("NotFound updated in background.js:", response.notFound);
                    }
                });
              console.log("Notifying the background script to move to the next item...");
              chrome.runtime.sendMessage({ action: "process_next_item" });
              return;
          }
        }, 200); // Check every 200 ms
      };
    
      // Step 1: Wait for the products list container to load
      waitForElement(productsListSelector, async (productsList) => {
        console.log("Products list loaded. Finding products...");
      
        const productTitles = productsList.querySelectorAll('[class*="Product__UpdatedTitle-sc"]');
      
        console.log(`Found ${productTitles.length} product titles on the page.`);
  
        // Get the top 3 product names
        let topProductTitles = Array.from(productTitles).slice(0, 3).map((title) => title.textContent.trim());
        console.log("Top 3 products title :", topProductTitles);
  
        const sanitizedProductNames = topProductTitles.map(product => 
          product.replace(/[^a-zA-Z0-9\s,.-]/g, '') // Remove any non-ASCII characters
        );

        // Join topProducts array into a comma-separated string
        const topProductsString = sanitizedProductNames.join(", ");
        console.log("Top 3 products as a string:", topProductsString);

        // Step 2: Find all the product links
        productLinks = productsList.querySelectorAll('a[data-test-id="plp-product"]');
        
        if (productLinks.length > 0) {
          console.log(`Found ${productLinks.length} products on the page.`);
      
          // Get the top 3 products from the page
          let topProducts = Array.from(productLinks).slice(0, 3).map((link) => link.textContent.trim());
          console.log("Top 3 products:", topProducts);
          let finalProductsList = []; // Array to store valid products

          const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9\s,.-]/g, '');  // Remove special characters

          const sanitizedMyCurrentItem = sanitizeString(myCurrentItem);

          console.log("Waiting...");
          const promptPart1 = `Select one product that matches with `;
          const promptPart2 = `${sanitizeString(myCurrentItem)}`;
          const promptPart3 = ` from the list `;
          const promptPart4 = `${sanitizeString(topProductsString)}`;

          const finalizeIng = promptPart1 + promptPart2 + promptPart3 + promptPart4;
          
          /*
          chrome.runtime.sendMessage({
            message: "finalise_product",
            prompt: finalizeIng,
            productLinks: productLinks
          });
          */
          try {
            chrome.runtime.sendMessage({
              message: "finalise_product",
              prompt: finalizeIng,
              topProductTitles: topProductTitles,
              myCurrentItem: myCurrentItem
          }, (response) => {
              if (chrome.runtime.lastError) {
                  console.error("Error sending message:", chrome.runtime.lastError);
                  // Retry or handle the closure gracefully
              } else {
                  console.log("Message sent successfully:", response);
                  // Process the response if necessary
              }
          });
          } catch (error) {
            if (error instanceof DOMException) {
              console.error("DOMException occurred:", error.name, error.message);
              // You can display a user-friendly message or take specific actions based on the error
            } else {
              console.error("An unexpected error occurred:", error);
              // Handle other errors gracefully
            }
          }
            
        }
      
        // Always print the NotFound array at the end
        //console.log("Not Found Products Array:", NotFound);
        chrome.runtime.sendMessage({ action: "get_not_found" }, (response) => {
          if (response) {
              const notFoundArr = response.notFound;
              console.log("Retrieved NotFound array:", notFoundArr);
      
              // Check if container exists
              let container = document.getElementById('not-found-container');
              if (!container) {
                  // Create the container
                  container = document.createElement('div');
                  container.id = 'not-found-container';
                  container.style.position = 'fixed';
                  container.style.top = '10%';
                  container.style.right = '10%';
                  container.style.width = '300px';
                  container.style.backgroundColor = 'white';
                  container.style.border = '1px solid black';
                  container.style.padding = '10px';
                  container.style.zIndex = '10000';
                  container.style.overflowY = 'auto';
                  container.style.maxHeight = '50%';
                  container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      
                  // Add a close button as "X"
                  const closeButton = document.createElement('span');
                  closeButton.innerText = '×'; // Unicode character for a close icon
                  closeButton.style.fontSize = '18px';
                  closeButton.style.fontWeight = 'bold';
                  closeButton.style.cursor = 'pointer';
                  closeButton.style.position = 'absolute';
                  closeButton.style.top = '5px';
                  closeButton.style.right = '10px';
                  closeButton.onclick = () => container.remove();
                  container.appendChild(closeButton);
      
                  // Add a heading to the container
                  const heading = document.createElement('strong');
                  heading.textContent = 'Could not add below ingredients :';
                  container.appendChild(heading);
      
                  // Append the container to the body
                  document.body.appendChild(container);
              }
      
              // Create and append the list of items
              const list = document.createElement('ul');
              notFoundArr.forEach((item) => {
                  const listItem = document.createElement('li');
                  listItem.textContent = item;
                  list.appendChild(listItem);
              });
              container.appendChild(list);
          }
        });
      
      
      
        
      });
    });
}