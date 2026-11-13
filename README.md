
# AndersWik.se

## Development 

### Start Jekyll

```bash
$ vagrant ssh
$ cd /var/www/public_html
$ jekyll serve --host=0.0.0.0 --watch --force_polling
```

Then open http://127.0.0.1:4000/ http://localhost:4000 or http://192.168.56.35:4000 on the host.

### SCSS

```bash
$ sudo apt install ruby-sass
$ sass --watch input.scss output.css
```

```bash
$ sass _sass/_style.scss css/style.css
```

### Build Production

```bash
$ vagrant ssh
$ cd /var/www/public_html
$ JEKYLL_ENV=production jekyll build
```

This uses `url` from `_config.yml` (https://www.anderswik.se). `jekyll serve` overrides it with the local address, so never deploy a `_site` built by `serve`.

### Progressive Web Apps

The apps in `_data/pwa.yml` can be installed. After changing an app or the list:

```bash
$ python3 _scripts/make-pwa.py            # all apps
$ python3 _scripts/make-pwa.py blackjack  # only some apps
```