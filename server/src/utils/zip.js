import archiver from "archiver";

export function zipStreamResponse(res, filename) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);

    return {
        append: (name, bufOrStream) => archive.append(bufOrStream, { name }),
        finalize: () => archive.finalize(),
        archive
    };
}
