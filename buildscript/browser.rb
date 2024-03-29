require 'rbconfig'

if Config::CONFIG['host'].include?('mswin')
  require 'win32_process'
end

if Config::CONFIG['host'].include?('linux')
  require 'linux_process'
end

module Browser

  def host
    Config::CONFIG['host']
  end

  def macos?
    host.include?('darwin')
  end

  def windows?
    host.include?('mswin')
  end

  def linux?
    host.include?('linux')
  end
  
  class Browser
    def supported?; true; end
    def setup ; end
    def visit(url) ; end
    def teardown ; end
    
    def applescript(script)
      raise "Can't run AppleScript on #{host}" unless macos?
      system "osascript -e '#{script}' 2>&1 >/dev/null"
    end
  end

  class Firefox < Browser
    def initialize(path='c:\Program Files\Mozilla Firefox\firefox.exe')
      @path = path
    end
    
    def visit(url)
      applescript('tell application "Firefox" to Get URL "' + url + '"') if macos? 
      Thread.new do
        system("firefox '#{url}'") if linux?
        system("#{@path} -new-window #{url}") if windows? 
      end
    end
    
    def to_s
      "Firefox"
    end
    
    def teardown
      kill_process 'firefox'
      sleep 1 # wait for process handle killed
    end
  end

  class Opera < Browser
    def initialize(path='C:\Program Files\Opera\opera.exe')
      @path = path
    end
    
    def visit(url)
      Thread.new do
        system("opera '#{url}'") if linux?    
        system("#{@path} #{url}") if windows?    
      end
    end
    
    def to_s
      "Opera"
    end
    
    def teardown
      kill_process 'opera' if linux?
      kill_process 'Opera' if windows?
      sleep 1 # wait for process handle killed
    end
  end

  class Safari < Browser
    def supported?
      macos?
    end
    
    def setup
      applescript('tell application "Safari" to make new document')
    end
    
    def visit(url)
      applescript('tell application "Safari" to set URL of front document to "' + url + '"')
    end
    
    def teardown
      #applescript('tell application "Safari" to close front document')
    end
    
    def to_s
      "Safari"
    end
  end

  class IE < Browser
    def initialize()
    end
    
    def setup
      @ie = WIN32OLE.new('InternetExplorer.Application') if windows?
      @ie.visible = true
    end
    
    def supported?
      windows?
    end
    
    def visit(url)
      @ie.navigate("#{url}")
    end
    
    def teardown
      @ie.quit
    end
    
    def to_s
      "Internet Explorer"
    end
  end

  class Konqueror < Browser
    def supported?
      linux?
    end
    
    def visit(url)
      system("kfmclient openURL #{url}")
    end
    
    def to_s
      "Konqueror"
    end
  end

  # shut up, webrick :-)
  class ::WEBrick::HTTPServer
    def access_log(config, req, res)
      # nop
    end
  end

  class ::WEBrick::BasicLog
    def log(level, data)
      # nop
    end
  end
end
