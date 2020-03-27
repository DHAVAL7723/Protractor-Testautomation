describe('PhysicianSearch test', function() {

    function scroll_down(){
        browser.executeScript('window.scrollTo(0,400);').then(function () {
                console.log('\n********* SCROLLED DOWN *********');
        });  
    };

    function scroll_to_bottom() {
        browser.executeScript('window.scrollTo(0,10000);').then(function () {
                console.log('\n********* SCROLLED TO BOTTOM *********');
        });  
    };

    function scroll_to_top() {
        browser.executeScript('window.scrollTo(0,0);').then(function () {
                console.log('\n********* SCROLLED TO TOP *********');
        });  
    };

	it('It should open main web page', function() {
        
        browser.waitForAngularEnabled(false);
        browser.ignoreSynchronization=true;  
        browser.manage().timeouts().implicitlyWait(5000);
        browser.driver.manage().window().maximize();
        browser.get('https://demo.clickdoc.de/cd-de/search');
        browser.sleep(2000);
             	    
    });

    var searchName = element(by.id('search-query-typeahead'));
    var location  = element(by.id('search-location-typeahead'));
    var onlineTermin = element(by.id('onlineAppointmentsIcon'));
    var videoCall = element(by.cssContainingText('.text', 'Videosprechstunde'));
    var accessibility = element(by.cssContainingText('.text', 'Barrierefreiheit'));
    var search = element(by.buttonText('Suchen'))

    it('It should check the search section', function(){

        searchName.click();
        location.click();
        onlineTermin.click();
        videoCall.click(); 
        accessibility.click(); 
        search.click();
        
        // Un-click
        onlineTermin.click();
        videoCall.click();
        accessibility.click(); 
                
    });


    it('It should verify result section', function(){

       expect(element(by.xpath('//*[@id="search"]/div/div[3]/div/div/app-empty-state/div/div[2]/div/span')).getText())
       .toBe('AUF DER LINKEN SEITE KANNST DU DIE ARZTSUCHE STARTEN.');
        
    });

    var BesteErgebnisse = element(by.cssContainingText('.text', 'Beste Ergebnisse'));
    var AlphabetischNachArztname = element(by.cssContainingText('.text', 'Alphabetisch nach Arztname')); 

    it('It should check the sorting-section', function(){
    
        location.sendKeys('44801').click();

        console.log('\nBug! : Distance Checkbox and Distance-Range slider only appear when location input is given');
        scroll_down();
        browser.sleep(5000);

        // Click 
        BesteErgebnisse.click(); 
        AlphabetischNachArztname.click(); 

        // Un-click
        BesteErgebnisse.click(); 
        AlphabetischNachArztname.click(); 

        console.log('\nBug! : Result section shows some result even when name input field is emety. See the bug1.png screenshot ');
        location.clear();
    });
    

    it('It should select the Name Inputfield in the search section and enter any input', function(){
       
        browser.get('https://demo.clickdoc.de/cd-de/search');
        searchName.sendKeys("Beate");
        browser.sleep(2000);
    });

    it('It should Enter further input to refine the search', function(){
        
        searchName.sendKeys(" Edel");
        browser.sleep(1000);
    });

    it('It should enter further input for which no results exist', function(){

        searchName.sendKeys(" se");
        browser.sleep(1000);
    });

    it('It should enter valid input into „Name“ Inputfield again, and press the „Search“-Button', function(){

        searchName.clear();
        location.clear();
        searchName.sendKeys("Beate");
        search.click();
        browser.sleep(4000); 
    });

    it('It should check a search-result object', function(){

        console.log('\nSearch results are displyed.');
    });

    it('It should scroll to the bottom of the page', function(){

        scroll_to_bottom();
        browser.sleep(2000);
    });

    it('It should click the Show more Button', function(){

        element(by.cssContainingText('.load-more-link', ' Mehr anzeigen ')).click();
        browser.sleep(2000);
        console.log('\nAdditional results are loaded.');
    });

    it('It should croll back to the top and enter valid data into the Location-Inputfield', function(){
  
        scroll_to_top();
        browser.sleep(1000);
        location.sendKeys('56567');  
    });

    it('It select from Scroll suggestion', function(){

        browser.sleep(1000);
        location.element(by.xpath('//typeahead-container/button[2]')).click();
        search.click();
        browser.sleep(6000);
    });
  
    it('It should check the Online Bookable Checkbox', function(){

        onlineTermin.click();
        browser.sleep(1000);
    }); 

    it('It should click the Search-Button again', function(){

        browser.sleep(1000);
        search.click();
        browser.sleep(2000);
    });

    it('It should check Video-Conference Checkbox, empty the "Name" inputfield and click the Search Button again', function(){

        videoCall.click();
        browser.sleep(1000);

        searchName.clear();
        search.click();
        browser.sleep(2000);

        console.log('\nBug! : "Dr. med. Elvira Elver" is not displyed.');

    });

    it('It should uncheck Video-Conference Checkbox again, check Barrier-Free Checkbox and click search again', function(){

        videoCall.click(); // Uncheck Video-Conference Checkbox
        browser.sleep(1000);

        accessibility.click();
        search.click();
        browser.sleep(2000);
    });

    it('It should check the „Alphabetical-Sort“ option in the sorting section', function(){
       
        onlineTermin.click(); // UnClick
        accessibility.click(); // UnClick
        searchName.clear();
        searchName.sendKeys('Beate') 
        browser.sleep(1000);

        search.click();
        browser.sleep(4000);

        scroll_down();
        AlphabetischNachArztname.click();
        browser.sleep(5000);
    });

    it('It should check the Distance-Sort option in the sorting section', function(){

        scroll_to_top();
        location.sendKeys('44801');
        browser.sleep(5000);

        scroll_down();
        browser.sleep(3000);

        var distance = element(by.cssContainingText('.text', 'Entfernung vom Stadtzentrum'));
        distance.click();
        browser.sleep(5000);
    });

    it('It should drag range slider without releasing it', function(){

        var slider = element(by.xpath('//*[@id="search"]/div/div[2]/div[2]/div[2]/app-sort/div/div/div[5]/div/div/ng5-slider/span[5]'));
        browser.actions().mouseDown(slider).mouseMove({x: 90, y: 0}).perform();
        browser.sleep(5000);
    });

    it('Release dragging of slider', function(){

        browser.actions().mouseUp().perform();
        browser.sleep(5000);

        scroll_to_top();
        browser.sleep(5000);
    });

});
