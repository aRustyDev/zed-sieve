
use std::fs;
use zed::lsp::CompletionKind;
use zed::{serde_json, CodeLabel, LanguageServerId, Result};
use zed_extension_api::{self as zed, Command, DownloadedFileType, Worktree};

struct SieveExtension {
    cached_binary_path: Option<String>,
}

impl zed::Extension for SieveExtension {
    fn new() -> Self {
        Self {
            cached_binary_path: None,
        }
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<Command> {
        match language_server_id.as_ref() {
            "sieve_lsp" => {
                let command_path = self.language_server_binary_path(language_server_id, worktree)?;
                Ok(Command {
                    command: command_path,
                    args: vec!["--stdio".to_string()],
                    env: Default::default(),
                })
            }
            _ => Err("Unknown language server".into()),
        }
    }

    fn language_server_binary_path(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<String> {
        if let Some(path) = &self.cached_binary_path {
            if fs::metadata(path).map_or(false, |stat| stat.is_file()) {
                return Ok(path.clone());
            }
        }

        zed::set_language_server_installation_status(
            &language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );

        let release = zed::latest_github_release(
            "yourusername/sieve-language-server",
            zed::GithubReleaseOptions {
                require_assets: true,
                pre_release: false,
            },
        )?;

        let (platform, arch) = zed::current_platform();
        let asset_name = format!(
            "sieve-lsp-{}-{}.{}",
            platform.as_ref(),
            arch.as_ref(),
            match platform {
                zed::Os::Mac | zed::Os::Linux => "tar.gz",
                zed::Os::Windows => "zip",
            }
        );

        let asset = release
            .assets
            .iter()
            .find(|asset| asset.name == asset_name)
            .ok_or_else(|| format!("no asset found matching {:?}", asset_name))?;

        let version_dir = format!("sieve-lsp-{}", release.version);
        let binary_path = format!(
            "{}/sieve-lsp{}",
            version_dir,
            match platform {
                zed::Os::Windows => ".exe",
                _ => "",
            }
        );

        if !fs::metadata(&binary_path).map_or(false, |stat| stat.is_file()) {
            zed::set_language_server_installation_status(
                &language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            zed::download_file(
                &asset.download_url,
                &version_dir,
                match platform {
                    zed::Os::Mac | zed::Os::Linux => DownloadedFileType::GzipTar,
                    zed::Os::Windows => DownloadedFileType::Zip,
                },
            )
            .map_err(|e| format!("failed to download file: {e}"))?;

            let entries =
                fs::read_dir(".").map_err(|e| format!("failed to list working directory {e}"))?;
            for entry in entries {
                let entry = entry.map_err(|e| format!("failed to load directory entry {e}"))?;
                if entry.file_name().to_str() != Some(&version_dir) {
                    fs::remove_dir_all(&entry.path()).ok();
                }
            }

            zed::make_file_executable(&binary_path)?;

            zed::set_language_server_installation_status(
                &language_server_id,
                &zed::LanguageServerInstallationStatus::None,
            );
        }

        self.cached_binary_path = Some(binary_path.clone());
        Ok(binary_path)
    }
}

zed::register_extension!(SieveExtension);
