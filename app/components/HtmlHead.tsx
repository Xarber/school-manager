import Head from 'expo-router/head';
import { Platform } from 'react-native';

type Props = {
    type?: string;
    site_name?: string;
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    locales?: string[];

    // Article Props
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];

    // Profile Props
    firstName?: string;
    lastName?: string;
    username?: string;
};

export default function HtmlHead({
    type = "website",
    site_name,
    title,
    description,
    image,
    imageAlt,
    locales = [],

    // Article Props
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags,

    // Profile Props
    firstName,
    lastName,
    username,
}: Props) {
    // do nothing on native
    if (Platform.OS !== 'web') return null;

    return (
        <Head>
            <meta property="og:type" content={type} />
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}

            {/* Open Graph */}
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}
            {imageAlt && <meta property="og:image:alt" content={imageAlt} />}

            {site_name && <meta property="og:site_name" content={site_name} />}

            {locales.map((locale, i) => (
                <meta key={i} property={i === 0 ? "og:locale" : "og:locale:alternate"} content={locale} />
            ))}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />

            {/* If type is article */}
            {type === "article" && (
                <>
                    {publishedTime && <meta property="article:published_time" content={publishedTime} />}
                    {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
                    {authors && authors.map((author, i) => (
                        <meta key={i} property="article:author" content={author} />
                    ))}
                    {section && <meta property="article:section" content={section} />}
                    {tags && tags.map((tag, i) => (
                        <meta key={i} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* If type is profile */}
            {type === "profile" && (
                <>
                    {firstName && <meta property="profile:first_name" content={firstName} />}
                    {lastName && <meta property="profile:last_name" content={lastName} />}
                    {username && <meta property="profile:username" content={username} />}
                </>
            )}
        </Head>
    );
}