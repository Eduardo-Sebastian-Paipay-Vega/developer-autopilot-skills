# Alineación de Componentes Canónicos con la Librería UI del Proyecto

Leer primero `toolkit.config.json → stack.ui_libraries` y usar **exclusivamente** la columna de la librería real instalada en el proyecto. Nunca mezclar controles equivalentes de dos librerías en la misma pantalla.

| Componente Canónico (`UI-STD-001`) | PrimeReact | shadcn/ui + Radix UI | PrimeNG (Angular) | Material UI (MUI) | Vuetify (Vue) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Botón (`Button`)** | `Button` (`loading`, `severity`) | `Button` (`variant`, `size`) | `p-button` (`[loading]`, `severity`) | `LoadingButton` / `Button` | `v-btn` (`:loading`) |
| **Texto (`TextInput`)** | `InputText` + `FloatLabel` | `Input` + `Label` + `FormMessage` | `pInputText` + `p-floatlabel` | `TextField` | `v-text-field` |
| **Contraseña (`Password`)** | `Password` (`toggleMask`) | `Input type="password"` + toggle | `p-password` (`[toggleMask]`) | `TextField` + `InputAdornment` | `v-text-field` + `append-inner-icon` |
| **Numérico / Moneda** | `InputNumber` (`mode="currency"`) | `Input` + formateador `Intl` | `p-inputnumber` | `TextField` / `NumericFormat` | `v-text-field` |
| **Select / Combobox** | `Dropdown` (`filter`) / `MultiSelect` | `Select` / `Command` (Combobox) | `p-select` (`[filter]`) / `p-multiselect` | `Select` / `Autocomplete` | `v-select` / `v-autocomplete` |
| **Checkbox / Radio / Switch** | `Checkbox` / `RadioButton` / `InputSwitch` | `Checkbox` / `RadioGroup` / `Switch` | `p-checkbox` / `p-radiobutton` / `p-toggleswitch` | `Checkbox` / `RadioGroup` / `Switch` | `v-checkbox` / `v-radio-group` / `v-switch` |
| **Fecha / Rango** | `Calendar` (`selectionMode="range"`) | `Calendar` + `Popover` | `p-datepicker` | `DatePicker` (`@mui/x-date-pickers`) | `v-date-picker` |
| **Carga de Archivos** | `FileUpload` | Dropzone custom + `Progress` | `p-fileupload` | Dropzone + `LinearProgress` | `v-file-input` |
| **Tabla Enterprise (`DataTable`)** | `DataTable` + `Column` + `Paginator` | `@tanstack/react-table` + `Table` | `p-table` (`[scrollable]`, `pFrozenColumn`) | `DataGrid` (`@mui/x-data-grid`) | `v-data-table-server` |
| **Tarjeta / KPI (`Card`)** | `Card` | `Card` (`CardHeader/Content`) | `p-card` | `Card` + `CardContent` | `v-card` |
| **Badge / Tag** | `Tag` / `Badge` | `Badge` | `p-tag` / `p-badge` | `Chip` / `Badge` | `v-chip` / `v-badge` |
| **Pestañas (`Tabs`)** | `TabView` / `TabPanel` | `Tabs` (`TabsList/Trigger/Content`) | `p-tabs` (`p-tablist`/`p-tabpanel`) | `Tabs` + `Tab` | `v-tabs` + `v-tabs-window` |
| **Modal (`Dialog`)** | `Dialog` (`dismissableMask={false}`) | `Dialog` / `AlertDialog` | `p-dialog` (`[dismissableMask]="false"`) | `Dialog` | `v-dialog` (`persistent`) |
| **Drawer (`Slide-over`)** | `Sidebar` | `Sheet` | `p-drawer` | `Drawer` | `v-navigation-drawer` |
| **Toast / Alert** | `Toast` (`sticky: true` en error) / `Message` | `Sonner` / `Toast` + `Alert` | `p-toast` (`sticky: true`) / `p-message` | `Snackbar` + `Alert` | `v-snackbar` + `v-alert` |
| **Skeleton / Progress** | `Skeleton` / `ProgressBar` | `Skeleton` / `Progress` | `p-skeleton` / `p-progressbar` | `Skeleton` / `LinearProgress` | `v-skeleton-loader` / `v-progress-linear` |
| **Breadcrumb / Menu** | `BreadCrumb` / `Menu` | `Breadcrumb` / `DropdownMenu` | `p-breadcrumb` / `p-menu` | `Breadcrumbs` / `Menu` | `v-breadcrumbs` / `v-menu` |
| **Tooltip / Popover** | `Tooltip` / `OverlayPanel` | `Tooltip` / `Popover` | `pTooltip` / `p-popover` | `Tooltip` / `Popover` | `v-tooltip` / `v-menu` |
