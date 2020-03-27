describe('Login test', function() {

	it('It should open main web page', function() {
        browser.waitForAngularEnabled(false);
        browser.ignoreSynchronization=true;  // or false
        browser.manage().timeouts().implicitlyWait(5000);
        browser.driver.manage().window().maximize();
        browser.get('https://demo.clickdoc.de/cd-de/search');
        element(by.xpath('/html/body/app-root/div[2]/app-tracking/div/div/div[2]/div[1]')).click();
            	    
    });

    it('It should click on profile', function(){
         element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[5]/a/span[2]')).click();
    	
    });

    it('It should change frame', function(){

        let f1 = element(by.xpath("//iframe[@id='iframeDialog']")).getWebElement();
        browser.switchTo().frame(f1);
        
    });

    var button = element(by.xpath('/html/body/app-root/div/div/main/app-login/div/div[1]/div/div/div[2]/div[2]/div[2]/button'));
    var Email = element(by.id("mat-input-0"));
    var password = element(by.id("mat-input-1"));

    it('It should click login button without enter email and password', function(){

        button.click();
        browser.getTitle().then( title => {
            console.log("\nThe current page title is" + " " +title);
        })   
        console.log('\nEmail and password field is red.');    
        browser.sleep(1000);

    });

    it('It should enter valid email and wrong password', function(){

        Email.sendKeys("dirk.nonn@cgm.com#1111");
        password.sendKeys("1234xyz");
        button.click();
        expect(element(by.tagName('p')).getText()).toBe('Bitte überprüfen Sie Ihre E-Mail-Adresse, Passwort und probieren Sie es noch einmal.');
        console.log('\nButton clicked with wrong email or password');
        Email.clear();
        password.clear();
    	
    });

    it('It should enter invalid email', function(){

        Email.sendKeys("dirk@cgm.com#1111");
        button.click();
        expect(element(by.tagName('p')).getText()).toBe('Bitte überprüfen Sie Ihre E-Mail-Adresse, Passwort und probieren Sie es noch einmal.');
        console.log('\nValid email and password is not provided.');
        Email.clear();

    });

    it('It should enter valid email and password', function(){

    	Email.sendKeys("dirk.nonn@cgm.com#1111");
        password.sendKeys("recruitingTest1!");
        button.click();
        browser.sleep(10000);
        
        browser.switchTo().defaultContent();
        browser.sleep(2000);
        
    });

    it('It should click on profil and select', function(){

        var menu = element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[7]/a/app-avatar/div/img'));
        menu.click();
        element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[7]/div/div/a[2]/div/span[2]')).click();
        browser.sleep(3000);

        browser.getTitle().then( title => {
            console.log("\nThe current page title is" + " " + title);
            console.log("\nLogout successful");
        }) 

    });

});
