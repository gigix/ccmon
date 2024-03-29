require 'rake/tasklib'
require 'thread'
require 'webrick'
require 'browser'
require 'test_case_result'
require 'jsunit_result'
require 'selenium_result'

include Browser

class JavaScriptTestTask < ::Rake::TaskLib
  def initialize(name=:test)
    @name = name
    @tests = []
    @browsers = []
    @port = 4444
    
    @queue = Queue.new
    
    
    @server = WEBrick::HTTPServer.new(:Port => @port) # TODO: make port configurable
    @server.mount_proc("/jsunitResults") do |req, res|
      parser, log_file = [JsUnitResult.new(req), "build/logs/JsUnitResults.xml"]
      html_report = handle_test_results(res, parser, log_file)    
    end
    
    yield self if block_given?
    define
  end
  
  def handle_test_results(res, parser, log_file)
    html_report = parse_result(parser, log_file)
    res.body += html_report
    @queue.push(parser.success?)
    return html_report
  end
  
  def parse_result(parser, log_file)
    xml = parser.to_xml()
    mkdir_p 'build/logs'
    File.open(log_file, File::CREAT|File::RDWR) do |f|
      f << xml
    end
    parser.to_html()
  end
  
  def define
    task @name do
      trap("INT") {
        puts "INT! test-server shutdown"
        @server.shutdown
      }
      t = Thread.new { 
        puts "Starting test-server"
        @server.start
      }
      
      @browsers.each do |browser|
        if browser.supported?
          puts "Running tests with #{browser}"
          @tests.each do |test|
            browser.setup
            browser.visit("http://localhost:#{@port}#{test}")              
            passed = @queue.pop
            browser.teardown
            raise "TEST FAILED" unless passed
          end            
          puts "Done tests with #{browser}"
        else
          puts "Skipping #{browser}, not supported on this OS"
        end
      end
      
      puts "Shutting down test-server"
      @server.shutdown
      t.join
    end
  end
  
  def mount(path, dir=nil)
    dir = Dir.pwd + path unless dir
    @server.mount(path, WEBrick::HTTPServlet::FileHandler, dir)
  end
  
  # test should be specified as a url
  def run(test)
    @tests << test
  end
  
  def browser(browser)
    @browsers << browser.new
  end
end
