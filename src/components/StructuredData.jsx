/**
 * JSON-LD block. React 19 hoists <script type="application/ld+json"> along with the rest of the
 * head tags, so this only has to render it.
 */
export default function StructuredData({ data }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
