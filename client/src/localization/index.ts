import {createI18n} from 'vue-i18n';
import en from './dictionaries/en.json';
import ru from './dictionaries/ru.json';
import ua from './dictionaries/ua.json';
import it from './dictionaries/it.json';
import fr from './dictionaries/fr.json';
import de from './dictionaries/de.json';


const STORAGE_KEY = 'image-tools-locale';
const savedLocale = localStorage.getItem(STORAGE_KEY);
const defaultLocale = 'en';
type LocaleType = 'en' | 'ru' | 'ua' | 'it' | 'fr' | 'de'

const i18n = createI18n({
    legacy: false,
    locale: savedLocale || defaultLocale,
    fallbackLocale: defaultLocale,
    messages: {
        en,
        ru,
        it,
        fr,
        ua,
        de
    },
});

export default i18n;

export function setLanguage(locale: LocaleType) {
    i18n.global.locale.value = locale;
    localStorage.setItem(STORAGE_KEY, locale);
}
