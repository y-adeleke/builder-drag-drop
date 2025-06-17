// src/pdf/MyReport.tsx
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { ExtractedArticle } from "./ArticleExtractor";
import { ContentBlock } from "./blocks/BlockTypes";

interface MyReportProps {
  article: ExtractedArticle;
}

export function MyReport({ article }: MyReportProps) {
  const { title, backgroundImg, date, description, profiles, sections = [] } = article;

  // Helper to render a single ContentBlock
  const renderBlock = (blk: ContentBlock, key: string | number) => {
    switch (blk.type) {
      case "heading":
        return (
          <Text key={key} style={styles.heading} wrap={false}>
            {blk.text}
          </Text>
        );
      case "paragraph":
        return (
          <Text key={key} style={styles.paragraph}>
            {blk.text}
          </Text>
        );
      case "image":
        return blk.src ? <Image key={key} style={styles.inlineImage} src={blk.src} /> : null;
      case "quote":
        return (
          <Text key={key} style={styles.quote}>
            “{blk.text}”
          </Text>
        );
      case "list":
        return (
          <View key={key} style={styles.list}>
            {(blk.items || []).map((item, i) => (
              <Text key={i} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        );
      case "divider":
        return <View key={key} style={styles.divider} />;
      case "definitionList":
        return (
          <View key={key}>
            {(blk.items || []).map((it, i) => {
              const [term, def] = it.split("|");
              return (
                <View key={i}>
                  <Text style={styles.defTerm}>{term}</Text>
                  <Text style={styles.defDesc}>{def}</Text>
                </View>
              );
            })}
          </View>
        );
      default:
        return null;
    }
  };

  // Walk through sections → maybe subsections → render blocks in order
  const renderAllContent = () => {
    const elements: React.ReactNode[] = [];

    sections.forEach((sec, si) => {
      // Section heading
      if (sec.heading) {
        elements.push(renderBlock(sec.heading, `sec-head-${si}`));
      }

      // Section content
      (sec.content || []).forEach((blk, ci) => {
        // Exhibit grouping: if this heading is "Exhibit N"
        if (blk.type === "heading" && /^Exhibit\s+\d+/.test(blk.text || "") && sec.content![ci + 1]?.type === "image" && sec.content![ci + 2]?.type === "paragraph") {
          elements.push(
            <View key={`exhibit-${si}-${ci}`} style={styles.exhibitBlock} wrap={false}>
              <Text style={styles.exhibitHeading}>{blk.text}</Text>
              <Image style={styles.exhibitImage} src={sec.content![ci + 1].src!} />
              <Text style={styles.exhibitCaption}>{sec.content![ci + 2].text}</Text>
            </View>
          );
          return; // skip the next two, since grouped
        }

        // Otherwise normal block
        elements.push(renderBlock(blk, `sec-${si}-blk-${ci}`));
      });

      // Subsections, if any
      (sec.subsections || []).forEach((sub, ssi) => {
        if (sub.heading) {
          elements.push(renderBlock(sub.heading, `sub-head-${si}-${ssi}`));
        }
        (sub.content || []).forEach((blk, sci) => {
          elements.push(renderBlock(blk, `sub-${si}-${ssi}-blk-${sci}`));
        });
      });
    });

    return elements;
  };

  return (
    <Document>
      {/* ─── COVER PAGE ─── */}
      <Page size="A4" style={styles.coverPage}>
        {backgroundImg && <Image style={styles.coverBg} src={backgroundImg} />}

        <View style={styles.brandLogo}>
          <Image style={styles.brandLogoImage} src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" />
          <Text style={styles.brandLogoText}>RBC BlueBay{"\n"}Asset Management</Text>
        </View>

        <Image style={styles.coverLogo} src="https://www.rbcroyalbank.com/dvl/assets/images/logos/rbc-logo-shield.svg" />

        <View style={styles.titleFrame}>
          <Text style={styles.coverTitle}>{title || "6 reasons to invest in emerging markets"}</Text>
          {description && <Text style={styles.coverDesc}>{description}</Text>}
        </View>
      </Page>

      {/* ─── BODY PAGE ─── */}
      <Page size="A4" style={styles.bodyPage}>
        <View style={styles.content}>{renderAllContent()}</View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Published: {date}</Text>
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  /* COVER */
  coverPage: { position: "relative", padding: 0 },
  coverBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 460,
  },
  brandLogo: {
    position: "absolute",
    top: 32,
    left: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogoImage: { width: 40, height: 40, marginRight: 8 },
  brandLogoText: { fontSize: 16, fontWeight: "bold", color: "#FFF" },
  coverLogo: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 32,
    height: 32,
  },
  titleFrame: { position: "absolute", bottom: 32, left: 32 },
  coverTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  coverDesc: { fontSize: 14, color: "#FFF", marginTop: 4 },

  /* BODY */
  bodyPage: {
    flexDirection: "column",
    padding: 32,
    fontSize: 12,
    lineHeight: 1.4,
  },
  content: { flex: 1 },
  footer: { position: "absolute", bottom: 16, left: 32 },
  footerText: { fontSize: 8, color: "#777" },

  /* Blocks */
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    breakInside: "avoid",
    keepTogether: true,
  },
  paragraph: { marginBottom: 8 },
  inlineImage: { marginVertical: 8, maxWidth: "100%" },
  quote: { fontStyle: "italic", textAlign: "center", marginVertical: 8 },
  list: { marginBottom: 8, paddingLeft: 12 },
  listItem: { marginBottom: 2 },
  divider: {
    width: "100%",
    borderBottom: "1pt solid #CCC",
    marginVertical: 8,
  },
  defTerm: { fontWeight: "bold" },
  defDesc: { marginLeft: 8, marginBottom: 4 },

  /* Exhibit grouping */
  exhibitBlock: {
    marginVertical: 12,
    breakInside: "avoid",
    keepTogether: true,
  },
  exhibitHeading: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  exhibitImage: { marginVertical: 4, maxWidth: "100%" },
  exhibitCaption: {
    fontSize: 10,
    color: "#555",
    marginBottom: 4,
  },
});
