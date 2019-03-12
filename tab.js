/* tab切换功能自定义插件 */
function Tab(config) {
    this.currentIndex = 0;
    this.tabMenus = null;
    this.tabMains = null;
    this.inint(config);
}
Tab.prototype = {
    constructor: Tab,
    inint: function(config) {
        this.initElement(config);           
        this.initEvent(config);           
        if(config.autoplay) {
            this.autoplay();
        } 
    },
    initElement: function(config) {
        this.tabMenus = document.getElementById(config.tabMenu).children;
        this.tabMains = document.getElementById(config.tabMain).children;
    },
    initEvent: function(config) {
        var self = this;
        var tabMenus = this.tabMenus;
        for(var i = 0; i < tabMenus.length; i++) {         
            tabMenus[i].index = i;
            tabMenus[i].onclick = function() {
                self.currentIndex = this.index;//点击后更改当前索引值
                clearInterval(self.timer);//先清除定时器
                self.change(this);
                if(!config.autoplayDisable) {
                    self.autoplay();//点击改变后再恢复定时器
                }
            }
        }
    },
    change: function(obj) {
        var tabMenus = this.tabMenus;
        var tabMains = this.tabMains;
        var length = tabMenus.length;
        for(var i = 0; i < length; i++) {
            tabMenus[i].className = 'tab-item';
            tabMains[i].className = 'main';
        }
        obj.className += ' active';
        tabMains[obj.index].className += ' selected';
    },
    autoplay: function() {
        var self = this;
        var index = self.currentIndex;
        var play = function() {
            index++;
            if(index > self.tabMenus.length - 1) {
                index = 0;
            }
            self.change(self.tabMenus[index]);
        };
        this.timer = setInterval(play, 2000);
    }
}