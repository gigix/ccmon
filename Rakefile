MISSING_LIBRARIES_MESSAGE = <<EOL
Please make sure you\'ve installed following gems before running Rake tasks:
  gem install builder
  gem install rubyzip
    
EOL

require 'fileutils'
require 'pathname'
require 'rubygems'

begin
  require 'zip/zip'
  require 'builder'
rescue Exception => e
  puts "#{e.message}\n#{MISSING_LIBRARIES_MESSAGE}"
  raise "required library cannot be found"
end

$:.unshift('buildscript')
$:.unshift('buildscript/lib/htree')

require 'javascripttest'

ARTIFACT_FILENAME= Pathname.new("build/dist/CCMon.gg")

desc "Default Task"
task :default => [ :clean, :test, :dist ]

desc "Clean"
task :clean do 
  rm_rf 'build'
end

class Dir
  def copy_to(dest_dir)
    src_dir = Pathname.new(self.path)
    dest_dir = Pathname.new(dest_dir)
    FileList["#{src_dir}/**/*"].each do |src|
      next if File.directory?(src)
      dest = dest_dir + Pathname.new(src).relative_path_from(src_dir)
      mkdir_p dest.dirname.to_s unless dest.dirname.directory?
      cp(src, dest) unless uptodate?(dest, src)
    end
  end
end

desc "Copy files to build/image"
task :image do
  Dir.new('code').copy_to('build/image')
end

desc "Distribute artifacts" 
task :dist => ARTIFACT_FILENAME

file ARTIFACT_FILENAME => [:image] do
  mkdir_p 'build/dist'
  rm_f ARTIFACT_FILENAME
  puts "building #{ARTIFACT_FILENAME}"
  Zip::ZipFile::open(ARTIFACT_FILENAME, true) do |zf|
    Dir['{build/image}/**/*'].each do |f| 
      zf.add(f.gsub(/build\/image\//, ''), f)
    end
  end
  puts "BUILD SUCCESSFUL"
end

desc "Runs all the jsunit tests and collects the results"
JavaScriptTestTask.new(:test) do |t|
  host = "http://localhost:4444"
  jsunit_tests = "/test/jsunit/testRunner.html?autoRun=true&testPage=#{host}/test/TestSuite.html&submitresults=localhost:4444/jsunitResults"
  t.mount("/code")
  t.mount("/test")
  t.run jsunit_tests
  t.browser(IE)
end
