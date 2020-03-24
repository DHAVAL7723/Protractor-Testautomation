describe('Login test', function() {

	browser.waitForAngularEnabled(false);

	browser.get('https://demo.clickdoc.de/cms-de/');

    console.log('*****0');
    element(by.buttonText('profile')).click();
    console.log('*****1');

    
    browser.sleep(15000);
	var mainWindow;
	browser.getAllWindowHandles().then(
	    function(handles) {
	        mainWindow = handles[0];
	        popupWindow = handles[1]; //at this point there should be only 1 window
	    }
	);

    console.log('*****2');
   
	var button = element(by.buttonText('Einloggen'));
    console.log('*****3');
	browser.getAllWindowHandles().then(function (handles) {    
	   console.log('*****4');  
	   handles.forEach(function(handle) {
	   	    console.log('*****5');
	        if (handle !== mainWindow) {
	        	browser.switchTo().window(handle);
	       		element(by.buttonText('Einloggen')).then(function(){ 
	            //do more stuff
	                console.log('*****0');
		            if (button) {
		            	button.click();
		            	browser.sleep(15000);
		            	console.log('*****1');
		            }
	            })
	        }
	    })
	});
    
    
	// it('it should open main web page', function() {
 //  		browser.waitForAngularEnabled(false);
 //   		browser.get('https://demo.clickdoc.de/cms-de/');
 //    	element(by.id('menu-item-2004')).click();
	//     browser.sleep(15000);
 //    });

 //    // ar button = element(by.xpath('//html/body/app-root/div/div/main/app-login/div/div[1]/div/div/div[2]/div[2]/div[2]/button'));
	
 //    it('it should click on login button', function() {
 //    	browser.get('https://demo.clickdoc.de/cd-de/search');

 //    	// var winndow_handles = browser.getAllWindowHandles();

 //     //    winndow_handles.then(function(handles)
     //    {
     //    	var mainWindow = handles[0];
     //    	var loginWindow = handles[1];
     //    	browser.switchTo().window(loginWindow);
     //    });

        // var wrapper = element(by.css('.row.justify-content-center.align-items-center'));
        // wrapper.click();
        // browser.actions().mouseMove(element(by.xpath('//html/body/app-root/div/div/main/app-login/div/div[1]/div/div/div[2]/div[2]/div[2]/button'))).perform()
        // element(by.id('iframeDialog')).element(by.buttonText('Einloggen')).click();
	// });
	// expect(li.getText()).toBe('Doge meme');
	
	// browser.sleep(3000);

	// // $('.life-btn life-primary-btn colored').getWebElement();
	// console.log("****3");

    
    // element(by.id('iframeDialog'))
    // .element(by.css('[placeholder = "E-Mail-Adresse"]')).click();

    // element(by.id('mat-form-field-label-1')).click();
	 // element(by.xpath('/html/body/app-root/div/div/main/app-login/div/div[1]/div/div/div[2]/div[1]/form/mat-form-field[1]/div/div[1]/div/input')).click();
	// element(by.tagName('form')).click();
 //    form1.element(by.id('mat-input-0')).click();
	// form1.element(by.id('mat-input-0')).sendKeys('dirk.nonn@cgm.com#1111');
	// browser.sleep(5000);
	// form1.element(by.id('mat-input-1')).click();
	// form1.element(by.id('mat-input-1')).sendKeys('xxxxxx');
	
	// button.click();

    // element(by.model('second')).sendKeys(2);
    
    // element(by.id('gobutton')).click();

    // expect(element(by.binding('latest')).getText()).
    //     toEqual('3'); // This is wrong!
    // var LogInButton = element(by.buttonText('Einloggen'));
	// var button = element(by.buttonText('Einloggen'));
	// var button = element(by.className("col-md-6")).element(by.className("life-btn life-primary-btn colored"));
        // var button = element(by.css('life-btn.life-primary-btn'));
    // var button = element(by.css(".row d-none d-md-flex")).element(by.css(".life-btn life-primary-btn colored"));
	
  
});











