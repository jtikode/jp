// `<` must be escaped so a literal "</script>" inside the JSON (e.g. in a
// product description) can't break out of the script tag.
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
