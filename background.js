let hardcodedItems = []; // Items will be updated dynamically from YouTube ingredients
let currentItemIndex = 0; // Track the current item being processed
let NotFound = []; // Persistent storage for not found items

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let stopProcessing = false;
let hiddenTabId = null;

const processCurrentItem = async (tabId) => {

  if (currentItemIndex < hardcodedItems.length) {
    const currentItem = hardcodedItems[currentItemIndex];
    console.log(`Processing item ${currentItemIndex + 1}/${hardcodedItems.length}: ${currentItem}`);
    const searchUrl = `https://blinkit.com/s/?q=${encodeURIComponent(currentItem)}`;
    console.log(`Refreshing tab with search URL: ${searchUrl}`);
    
    // Wait for 3 seconds before refreshing the tab
    await sleep(500);
  
    chrome.tabs.update(tabId, { url: searchUrl });
  } else {
    console.log("All items processed.");

    // Reset state
    currentItemIndex = 0;
    stopProcessing = false;
    hiddenTabId = null;
    hardcodedItems = [];
    NotFound = [];
    
    // Show a browser alert
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => alert('All items have been processed!')
    });
  }
};


chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.message === "lookup_ai") {
        console.log("Received prompt:", request.prompt);
        try {
            const session = await ai.languageModel.create({
                systemPrompt: `You are an assistant that helps extract shopping list from text descriptions.`,
            });
            
            let promptResp = await session.prompt(request.prompt);
            console.log("AI Response:", promptResp);
            
            const ingredients = promptResp.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            console.log("Extracted ingredients:", ingredients);
            
            chrome.tabs.sendMessage(sender.tab.id, {
                message: "ingredients_list_generated",
                ingredients: ingredients
            });
        } catch (error) {
            console.error("Error processing prompt:", error);
        }
    }

    if (request.message === "suggest_alternative") {
      console.log("Received prompt:", request.prompt);
      try {
          const session = await ai.languageModel.create({
              systemPrompt: `You are an assistant that suggests alternative ingredient for allergic ingredients`,
          });
          
          let promptResp = await session.prompt(request.prompt);
          console.log("Allergy prompt response :", promptResp);
          
          const replacement = promptResp.split("\n").map(line => line.trim()).filter(line => line.length > 0);
          console.log("Allergy prompt response trimmed :", replacement);
          
          const allergy = request.allergy;
          console.log(`Allergy = ${allergy}`);

          chrome.tabs.sendMessage(sender.tab.id, {
              message: "alternative_generated",
              replacement: replacement,
              allergy: allergy
          });
      } catch (error) {
          console.error("Error processing prompt:", error);
      }
    }

    if (request.message === "update_items") {
        console.log("Received ingredients list from YouTube:", request.ingredients);
    
        // Update hardcodedItems
        hardcodedItems = request.ingredients.map((item) =>
          item.replace(/\([^)]*\)/g, "").trim()
        );
        console.log("Updated hardcoded items for Blinkit:", hardcodedItems);
    
        // Print "Ordering items" and wait for 10 seconds
        console.log("Ordering items...");
        await sleep(500);
    
        // Start the Blinkit flow
        console.log("Starting Blinkit ordering process...");
        //chrome.tabs.create({ url: "https://blinkit.com/" }, (tab) => processCurrentItem(tab.id));
        chrome.tabs.create({ url: "https://blinkit.com/" }, (tab) => {
          hiddenTabId = tab.id; // Save the tab ID
          processCurrentItem(tab.id);
        });
      }

      if (request.action === "process_next_item") {
        if (stopProcessing) {
          console.log("process_next_item halted due to stop request.");
          currentItemIndex = 0;
          stopProcessing = false;
          hiddenTabId = null;
          hardcodedItems = [];
          NotFound = [];
          return;
        }
        console.log("Item added to cart. Moving to the next item...");
    
        // Wait for 3 seconds before processing the next item
        await sleep(500);
    
        currentItemIndex++;
        processCurrentItem(sender.tab.id);
      }

      if (request.action === "item_not_found") {
        console.log("Item not found. Skipping to the next item...");

        await sleep(500);

        currentItemIndex++;
        processCurrentItem(sender.tab.id);
      }

      if (request.action === "add_to_not_found") {
        // Add the item to the NotFound array
        NotFound.push(request.item);
        console.log("Updated NotFound array:", NotFound);
    
        // Respond to the sender with success
        sendResponse({ status: "success", notFound: NotFound });
      }

      if (request.action === "get_not_found") {
        // Send the current NotFound array back
        sendResponse({ notFound: NotFound });
      }

      if (request.action === "stopBackgroundProcessing") {
        stopProcessing = true; // Stop background processing
        console.log("Background processing stopped.");
      }

      if (request.message === "finalise_product") {
          console.log("Received prompt:", request.prompt);
          try {
              const session = await ai.languageModel.create({
                  systemPrompt: `You are an assistant that selects one relevant product name`,
              });
      
              let promptResp = await session.prompt(request.prompt);
              console.log("Finalise response:", promptResp);
      
              // Process the response
              const productName = promptResp
                  .split("\n")
                  .map(line => line.trim())
                  .filter(line => line.length > 0);
      
              console.log("Finalise response trimmed:", productName);
      
              const topProductTitles = request.topProductTitles;
              const myCurrentItem = request.myCurrentItem;
      
              console.log("topProductTitles:", topProductTitles);
      
              chrome.tabs.sendMessage(sender.tab.id, {
                  message: "productname_generated",
                  productName: productName,
                  topProductTitles: topProductTitles,
                  myCurrentItem: myCurrentItem
              });
      
          } catch (error) {
              console.error("Error processing prompt:", error);
      
              // Handle the NotSupportedError gracefully
              let fallbackProductName = ["Default Product"]; // Use a default or empty array
              if (error.name === "NotSupportedError") {
                  console.warn("The language model output was unsupported. Falling back to default.");
              } else {
                  console.warn("An unexpected error occurred. Using fallback values.");
              }
      
              // Ensure the flow continues even after the error
              const topProductTitles = request.topProductTitles;
              const myCurrentItem = request.myCurrentItem;
      
              console.log("Fallback response:", fallbackProductName);
              console.log("topProductTitles:", topProductTitles);
      
              
              chrome.tabs.sendMessage(sender.tab.id, {
                  message: "productname_not_generated",
                  productName: fallbackProductName,
                  topProductTitles: topProductTitles,
                  myCurrentItem: myCurrentItem
              });
          }
      }
      
});

// Inject `content.js` after a tab update or navigation on Blinkit
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        tab.url.includes("blinkit.com") && // Ensure it's a Blinkit URL
        changeInfo.status === "complete" // Ensure the page is fully loaded
    ) {
        console.log("Injecting content script into Blinkit tab...");
        chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"],
        });
    }
});

// Listen for tab closure
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === hiddenTabId) {
      console.log("Hidden Blinkit tab closed. Stopping background processing.");
      stopProcessing = true; // Stop further processing
      hiddenTabId = null; // Clear the hidden tab ID
  }
});