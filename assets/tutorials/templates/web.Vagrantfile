Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.network "private_network", ip: "vagrantip"
  config.vm.hostname = "vagranturl"

  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -y apache2
    echo "<h1>Hello from vagranturl</h1>" > /var/www/html/index.html
  SHELL
end
