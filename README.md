# FactGrid Viewer
<p>by Bruno Belhoste</p>

## Description

This tool provides a user interface to browse the FactGrid database https://database.factgrid.de/ (Wikibase instance). 

For more details see https://blog.factgrid.de/archives/2684.

## 🎨 Theme Customization / Changing Color Palettes

**The project now features an easy-to-configure theming system!**

### 🚀 Quick Theme Change (3 steps)

1. Open the file: **`src/app/display/_theme-variables.scss`**
2. Comment out the current palette (add `//` before lines 8-12)
3. Uncomment an alternative palette (remove `//` from desired lines)

**That's it!** The browser will automatically reload with the new colors.

### 📖 Full Documentation

- **Detailed guide**: See [`THEME-GUIDE.md`](./THEME-GUIDE.md)
- **Visual preview**: Open [`theme-preview.html`](./theme-preview.html) in your browser

### 🎯 Available Palettes

1. **Indigo Blue / Pink** (current) - Classic academic
2. **Academic Blue / Orange** - Dynamic and modern
3. **Forest Green / Amber** - Natural and calming
4. **Deep Violet / Cyan** - Creative and innovative
5. **Navy Blue / Coral** - Maritime and elegant
6. **Burgundy / Gold** - Luxurious and traditional

### ⚡ Example Change

In `_theme-variables.scss`, replace:
```scss
// Current palette
$primary-color: #283593;
$primary-light: #3F51B5;
$accent-color: #AD1457;
```

With:
```scss
// New palette (Forest Green / Amber)
$primary-color: #065f46;
$primary-light: #059669;
$accent-color: #d97706;
```

---

## Technologies used

Typescript

Angular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 20.0.2.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


