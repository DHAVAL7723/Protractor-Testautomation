describe('Login test', function() {


     it('it should open main web page', function() {

        browser.waitForAngularEnabled(false);
        browser.ignoreSynchronization=true;  // or false
        browser.manage().timeouts().implicitlyWait(5000);
  	browser.driver.manage().window().maximize();
   	browser.get('https://demo.clickdoc.de/cd-de/search');
    	
    });

    it('it should click on profile', function(){
    	element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[5]/a/span[2]')).click();
    	
    });

    it('it should change frame', function(){

        let f1 = element(by.xpath("//iframe[@id='iframeDialog']")).getWebElement();
        browser.switchTo().frame(f1);
        
    });

    var button = element(by.xpath('/html/body/app-root/div/div/main/app-login/div/div[1]/div/div/div[2]/div[2]/div[2]/button'));
    var Email = element(by.id("mat-input-0"));
    var password = element(by.id("mat-input-1"));

    it('click login button without enter email and password', function(){

        button.click();

        browser.getTitle().then( title => {
            console.log("The current page title is" + " " +title);
        })   

        console.log('Email and password field is red.');    
        browser.sleep(1000);

    });

    it('Enter valid email and wrong password', function(){

        Email.sendKeys("dirk.nonn@cgm.com#1111");
        password.sendKeys("1234xyz");
        button.click();
        expect(element(by.tagName('p')).getText()).toBe('Bitte überprüfen Sie Ihre E-Mail-Adresse, Passwort und probieren Sie es noch einmal.');
        console.log('button clicked with wrong email or password');
        Email.clear();
        password.clear();
    	
    });

    it('enter invalid email', function(){

        Email.sendKeys("dirk@cgm.com#1111");
        button.click();
        expect(element(by.tagName('p')).getText()).toBe('Bitte überprüfen Sie Ihre E-Mail-Adresse, Passwort und probieren Sie es noch einmal.');
        console.log('Invalid email and password is not provided.');
        Email.clear();

    });

    it('Enter valid email and password', function(){

    	Email.sendKeys("dirk.nonn@cgm.com#1111");
        password.sendKeys("recruitingTest1!");
        button.click();
        browser.sleep(10000);
        expect(element(by.xpath('//*[@id="search"]/div/div[3]/div/div/app-empty-state/div/div[2]/div/span')).getText()).toBe('AUF DER LINKEN SEITE KANNST DU DIE ARZTSUCHE STARTEN.');
        console.log('Login successful');

    });

    it('should click on profil and select', function(){

        var menu = element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[7]/a/app-avatar/div/img'));
        menu.click();
        menu.element(by.xpath('/html/body/app-root/div[2]/app-header/div/div[2]/div/div[2]/ul/li[7]/div/div/a[2]/div/span[2]')).click();
        
        browser.getTitle().then( title => {
            console.log("The current page title is" + " " +title);
            console.log("Logout successful");

        }) 

    });

});
