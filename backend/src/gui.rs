use env_logger;
use std::{
    sync::{Arc, Mutex},
};

use log::{debug, LevelFilter};
use std::io::Write;

use eframe::egui;

use crate::config::Config;

fn load_icon(path: &str) -> eframe::IconData {
    debug!("Loading icon...");
    let (icon_rgba, icon_width, icon_height) = {
        let image = image::open(path)
            .expect("Failed to open icon path")
            .into_rgba8();
        let (width, height) = image.dimensions();
        let rgba = image.into_raw();
        (rgba, width, height)
    };

    eframe::IconData {
        rgba: icon_rgba,
        width: icon_width,
        height: icon_height,
    }
}

pub fn gui(cfg: Config) {
    std::env::set_var("RUST_LOG", "info");

    let lg: Arc<Mutex<Vec<Log>>> = Arc::new(Mutex::new(vec![]));

    let options = eframe::NativeOptions {
        icon_data: Some(load_icon("assets/xavier.png")),
        ..Default::default()
    };

    {
        let lg = lg.clone();
        eframe::run_native(
            "Xavier",
            options,
            Box::new(|cc| {
                let xavier = Xavier::new(cc, lg, cfg);

                Box::new(xavier)
            }),
        );
    }
}

struct Log {
    level: String,
    message: String,
}

struct Xavier {
    log: Arc<Mutex<Vec<Log>>>,
    resizable: bool,
    cfg: Config,
}

impl Xavier {
    fn new(cc: &eframe::CreationContext<'_>, lg: Arc<Mutex<Vec<Log>>>, cfg: Config) -> Xavier {
        cc.egui_ctx.set_pixels_per_point(1.5);

        let mut builder = env_logger::Builder::new();

        builder
            .format({
                let log = lg.clone();
                let a = cc.egui_ctx.clone();
                move |buf, record| {
                    let mut lg_unlock = log.lock().unwrap();
                    let log_value = format!("{}: {}", record.level(), record.args());

                    let mut mssg = record.args().to_string();
                    if mssg.len() > 100 {
                        mssg = (&mssg[0..100]).to_string();
                    }

                    lg_unlock.push(Log {
                        level: record.level().to_string(),
                        message: mssg,
                    });

                    a.request_repaint();
                    writeln!(buf, "{}", log_value)
                }
            })
            .filter(None, LevelFilter::Debug)
            .filter_module("sea_orm", log::LevelFilter::Off)
            .filter_module("actix_web", log::LevelFilter::Off)
            .init();

        Xavier {
            log: lg.clone(),
            // repaint_rx: rx,
            resizable: false,
            cfg,
        }
    }

    fn table_ui(&mut self, ui: &mut egui::Ui) {
        use egui_extras::{Size, TableBuilder};

        let text_height = egui::TextStyle::Body.resolve(ui.style()).size;

        let table = TableBuilder::new(ui)
            .striped(true)
            .cell_layout(egui::Layout::left_to_right(egui::Align::Center))
            .column(Size::initial(60.0).at_least(40.0))
            .column(Size::remainder().at_least(60.0))
            .resizable(self.resizable);

        //
        table
            .header(20.0, |mut header| {
                header.col(|ui| {
                    ui.heading("Level");
                });
                header.col(|ui| {
                    ui.heading("Message");
                });
            })
            .body(|body| {
                let log = self.log.lock().unwrap();
                body.rows(text_height, log.len(), |row_index, mut row| {
                    row.col(|ui| {
                        ui.label(log[row_index].level.to_owned());
                    });
                    row.col(|ui| {
                        ui.add(egui::Label::new(log[row_index].message.to_owned()).wrap(false));
                    });
                });
            });
    }
}

impl eframe::App for Xavier {
    fn update(&mut self, ctx: &eframe::egui::Context, _: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            // ui.hyperlink_to("Xavier", "http://localhost:8000/wgfmu");
            ui.heading("Log");
            ui.separator();
            use egui_extras::{Size, StripBuilder};
            StripBuilder::new(ui)
                .size(Size::remainder())
                .size(Size::exact(25.0))
                .vertical(|mut strip| {
                    strip.cell(|ui| {
                        self.table_ui(ui);
                    });
                    strip.cell(|ui| {
                        ui.separator();
                        ui.vertical_centered(|ui| {
                            let tooltip_text = "Xavier web frontend";
                            ui.hyperlink_to(
                                "Xavier",
                                format!("http://localhost:{}/wgfmu", self.cfg.port),
                            )
                            .on_hover_text(tooltip_text);
                        });
                    });
                });
        });
    }
    fn on_close_event(&mut self) -> bool {
        true
    }
}
